# Platform: configuration and discovery (Consul)

## Centralized configuration

Non-secret configuration lives in Consul KV as JSON values:

| Prefix | Example keys |
| --- | --- |
| `config/shared/` | `outboxIntervalMs`, `consumerPrefetch` |
| `config/identity/` | `accessTokenTtlSeconds`, `refreshTokenTtlDays`, `serviceTokenTtlSeconds` |
| `config/catalog/` | `searchEnabled`, `searchTimeoutMs` |
| `config/commerce/` | `deliveryFees` |
| `config/search/` | `fuzziness`, `soldCountBoost`, `ratingBoost` |

Each service merges `shared` with its own prefix, validates the result with its Zod schema
(`src/config.ts`), and keeps watching with blocking queries. Values read through `config.get()` at
use time change without a restart (for example `consul kv put config/catalog/searchEnabled false`
switches search to the database fallback). An invalid change is rejected and logged; the last
valid configuration stays active. `infra/consul/init.sh` seeds defaults without overwriting keys
changed at runtime.

The environment carries only bootstrap addresses and secrets.

## Service discovery

- **Registration.** Every service registers itself at startup with an HTTP health check on
  `/health` (every 5 s) and deregisters on shutdown; Consul removes an instance whose check stays
  critical for a minute.
- **Server-side at the edge.** Kong resolves `identity.service.consul`, `catalog.service.consul`
  and `commerce.service.consul` through Consul DNS, so only healthy instances get traffic.
- **Client-side inside.** Service-to-service calls (`createInternalClient`) ask Consul's health API
  for passing instances, cache them for 10 s, pick round-robin, and try the next instance after a
  connection failure.
