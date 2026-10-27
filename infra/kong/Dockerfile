# The gateway image: Kong 3.9 (OSS) in DB-less mode with Seapedia's declarative config.
#   docker build -f infra/kong/Dockerfile -t seapedia-gateway .
FROM kong:3.9.4
USER root
COPY infra/kong/kong.yml.tmpl /kong/kong.yml.tmpl
COPY infra/kong/entrypoint.sh /kong/entrypoint.sh
RUN chmod 0755 /kong/entrypoint.sh && chown -R kong /kong
USER kong
ENV KONG_DATABASE=off \
    KONG_PROXY_LISTEN="0.0.0.0:8000" \
    KONG_ADMIN_LISTEN="127.0.0.1:8001" \
    KONG_STATUS_LISTEN="0.0.0.0:8100" \
    KONG_NGINX_WORKER_PROCESSES=1 \
    KONG_DNS_ORDER="LAST,A,SRV,CNAME" \
    KONG_PROXY_ACCESS_LOG=/dev/stdout \
    KONG_PROXY_ERROR_LOG=/dev/stderr \
    KONG_HEADERS=off
EXPOSE 8000
HEALTHCHECK --interval=10s --timeout=3s --retries=5 CMD kong health || exit 1
ENTRYPOINT ["/kong/entrypoint.sh"]
