#!/bin/sh
# Seeds Consul KV with Seapedia's non-secret configuration. Keys that already exist are left
# alone, so changes made at runtime (consul kv put ...) survive restarts.
set -eu

put() {
  if ! consul kv get "$1" >/dev/null 2>&1; then
    consul kv put "$1" "$2" >/dev/null
    echo "set $1"
  fi
}

# Shared by every service
put config/shared/outboxIntervalMs 500
put config/shared/consumerPrefetch 20

# identity
put config/identity/accessTokenTtlSeconds 600
put config/identity/refreshTokenTtlDays 7
put config/identity/serviceTokenTtlSeconds 300

# catalog
put config/catalog/searchTimeoutMs 500
put config/catalog/searchEnabled true

# commerce
put config/commerce/deliveryFees '{"instant":30000,"next_day":15000,"regular":10000}'

# search
put config/search/fuzziness '"AUTO"'
