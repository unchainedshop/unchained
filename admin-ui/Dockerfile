# Build from the monorepo root: admin-ui uses the shared npm workspace lock.
FROM node:26.12.1-alpine AS bundler
WORKDIR /source
ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN CYPRESS_INSTALL_BINARY=0 npm ci
RUN npm run lint --workspace=@unchainedshop/admin-ui
RUN npm run build --workspace=@unchainedshop/admin-ui

# next.config.js exports static files; next start cannot serve this output.
FROM caddy:2.11.7-alpine AS runtime
COPY --from=bundler /source/admin-ui/out /srv
COPY admin-ui/Caddyfile /etc/caddy/Caddyfile
ENV XDG_CONFIG_HOME=/tmp XDG_DATA_HOME=/tmp
USER 65534:65534
RUN test -s /srv/index.html && caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
HEALTHCHECK --timeout=2s --start-period=5s \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/ || exit 1
EXPOSE 3000
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
