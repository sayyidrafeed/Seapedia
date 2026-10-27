#!/bin/sh
# Seeds Consul KV with Seapedia's non-secret configuration. Keys that already exist are left
# alone, so changes made at runtime (consul kv put ...) survive restarts.
set -eu

# Create-only (check-and-set on index 0), so two init runs cannot race over a runtime change.
put() {
  if out=$(consul kv put -cas -modify-index=0 "$1" "$2" 2>&1); then
    echo "set $1"
    return
  fi
  case "$out" in
    *'CAS failed'*) ;;
    *) echo "$out" >&2; exit 1 ;;
  esac
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
