#!/bin/bash
# MongoDB as a single-node replica set (multi-document transactions need one) with auth.
# A replica set with auth needs a keyfile; a single node can regenerate it on every start.
set -euo pipefail
keyfile=/data/configdb/keyfile
openssl rand -base64 756 > "$keyfile"
chmod 400 "$keyfile"
chown mongodb:mongodb "$keyfile"
exec docker-entrypoint.sh mongod --replSet rs0 --bind_ip_all --keyFile "$keyfile" \
  --wiredTigerCacheSizeGB "${WIREDTIGER_CACHE_GB:-0.25}"
