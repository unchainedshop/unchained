# docker build -f docs/Dockerfile .
FROM node:26.8.2-bookworm-slim AS builder
WORKDIR /source/docs
COPY docs/package.json docs/package-lock.json ./
RUN npm ci --include=dev --no-audit --no-fund
COPY docs/ ./
RUN npm run build
ARG GIT_COMMIT=n/a
RUN printf '%s\n' "$GIT_COMMIT" > build/version

FROM nginx:1.30.4-alpine AS runtime
COPY LICENSE /licenses/unchained/LICENSE
ENV PORT=3000
COPY docker/static.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /source/docs/build /usr/share/nginx/html
HEALTHCHECK --start-period=5s --interval=20s --timeout=3s --retries=3 \
  CMD wget -q --spider --tries=1 "http://127.0.0.1:${PORT}/" || exit 1
EXPOSE 3000
