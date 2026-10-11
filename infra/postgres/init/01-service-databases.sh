#!/bin/sh
# Database per service: each service gets its own database and login role, and can reach no other.
# Runs once, on the first start of an empty data volume.
set -eu

for svc in identity catalog commerce; do
  var="$(echo "$svc" | tr '[:lower:]' '[:upper:]')_DB_PASSWORD"
  password="$(printenv "$var")"
  psql -v ON_ERROR_STOP=1 -v svc="$svc" -v pw="$password" \
    --username "$POSTGRES_USER" --dbname postgres <<'SQL'
CREATE ROLE :"svc" LOGIN PASSWORD :'pw';
CREATE DATABASE :"svc" OWNER :"svc";
REVOKE ALL ON DATABASE :"svc" FROM PUBLIC;
SQL
done
