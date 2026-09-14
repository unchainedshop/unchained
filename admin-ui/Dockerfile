# docker build -f admin-ui/Dockerfile .
FROM node:26.8.2-bookworm-slim AS builder
WORKDIR /source
ENV CYPRESS_INSTALL_BINARY=0 \
    MONGOMS_DISABLE_POSTINSTALL=1 \
    NEXT_TELEMETRY_DISABLED=1

# Admin UI dependencies belong to the monorepo lockfile.
COPY . .
RUN npm ci --include=dev --no-audit --no-fund
RUN npm run lint:check --workspace @unchainedshop/admin-ui

# Public URLs are compiled into the export, so configure them at build time.
ARG NEXT_PUBLIC_GRAPHQL_ENDPOINT
ARG NEXT_PUBLIC_CHAT_URL
ARG NEXT_PUBLIC_TEMP_FILE_UPLOAD_URL
ARG NEXT_PUBLIC_LOGO=/logo-light.svg
RUN npm run build --workspace @unchainedshop/admin-ui

FROM nginx:1.30.4-alpine AS runtime
COPY LICENSE /licenses/unchained/LICENSE
ENV PORT=3000
COPY docker/static.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /source/admin-ui/out /usr/share/nginx/html
HEALTHCHECK --start-period=5s --interval=20s --timeout=3s --retries=3 \
  CMD wget -q --spider --tries=1 "http://127.0.0.1:${PORT}/" || exit 1
EXPOSE 3000
