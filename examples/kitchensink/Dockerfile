# docker build -f examples/kitchensink/Dockerfile .
FROM node:26.8.2-bookworm-slim AS builder
WORKDIR /source
ENV CYPRESS_INSTALL_BINARY=0 \
    MONGOMS_DISABLE_POSTINSTALL=1 \
    NEXT_TELEMETRY_DISABLED=1

# Preserve workspace paths and install from the shared root lockfile.
COPY . .
RUN npm ci --include=dev --no-audit --no-fund
RUN npm run build
RUN npm prune --omit=dev --ignore-scripts --no-audit --no-fund

FROM node:26.8.2-bookworm-slim AS runtime
COPY LICENSE /licenses/unchained/LICENSE
ENV NODE_ENV=production \
    PORT=3000
WORKDIR /source
COPY --from=builder /source/package.json ./package.json
COPY --from=builder /source/node_modules ./node_modules
COPY --from=builder /source/packages ./packages
COPY --from=builder /source/examples ./examples
COPY --from=builder /source/admin-ui/package.json ./admin-ui/package.json
COPY --from=builder /source/admin-ui/out ./admin-ui/out
COPY docker/healthcheck.mjs /healthcheck.mjs

WORKDIR /source/examples/kitchensink
ARG GIT_COMMIT=n/a
RUN printf '%s\n' "$GIT_COMMIT" > version.txt
USER node
HEALTHCHECK --start-period=20s --interval=20s --timeout=3s --retries=3 \
  CMD ["node", "/healthcheck.mjs"]
EXPOSE 3000
CMD ["npm", "start"]
