#!/bin/sh
# Renders kong.yml from the environment, points Kong's DNS at Consul, then starts Kong.
set -eu

# PEM with real newlines or "\n" escapes -> one line with "\n" escapes (a YAML double-quoted string).
key=$(printf '%s' "$JWT_PUBLIC_KEY" | sed 's/\\n/\n/g' | awk 'BEGIN{ORS="\\n"} {print}' | sed 's/\\n$//')
origins=$(printf '%s' "$CORS_ORIGINS" | awk -F, '{printf "["; for (i=1;i<=NF;i++) printf "%s\"%s\"", (i>1?", ":""), $i; printf "]"}')

# sed would turn "\n" in the replacement into real newlines: escape the backslashes first.
key_for_sed=$(printf '%s' "$key" | sed 's/\\/\\\\/g')

sed -e "s|__JWT_PUBLIC_KEY__|$key_for_sed|" \
    -e "s|__CORS_ORIGINS__|$origins|" \
    -e "s|__UPSTREAM_IDENTITY__|${UPSTREAM_IDENTITY:-identity.service.consul:4001}|" \
    -e "s|__UPSTREAM_CATALOG__|${UPSTREAM_CATALOG:-catalog.service.consul:4002}|" \
    -e "s|__UPSTREAM_COMMERCE__|${UPSTREAM_COMMERCE:-commerce.service.consul:4003}|" \
    /kong/kong.yml.tmpl > /tmp/kong.yml

# Kong's resolver wants an IP: look Consul up once through Docker's DNS.
if [ -n "${CONSUL_DNS_HOST:-}" ]; then
  consul_ip=$(getent hosts "$CONSUL_DNS_HOST" | awk '{print $1; exit}')
  export KONG_DNS_RESOLVER="${consul_ip}:8600"
fi

export KONG_DECLARATIVE_CONFIG=/tmp/kong.yml
exec /docker-entrypoint.sh kong docker-start
