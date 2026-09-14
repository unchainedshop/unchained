# Build from the repository root. This image contains MongoDB for integration tests.
FROM node:26.8.2-bookworm-slim AS node
FROM mongo:8.2.12 AS ci

COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN apt-get update && apt-get install -y --no-install-recommends libatomic1 ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && ln -s ../lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
    && ln -s ../lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

WORKDIR /source
ENV MONGOMS_VERSION=8.2.12 \
    MONGOMS_SYSTEM_BINARY=/usr/bin/mongod \
    MONGOMS_DISABLE_POSTINSTALL=1 \
    CYPRESS_INSTALL_BINARY=0 \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_NO_WARNINGS=1 \
    NODE_ENV=test

# Keep every workspace at the path recorded in the root lockfile.
COPY . .
RUN npm ci --include=dev --no-audit --no-fund
RUN npm run build

CMD ["npm"]
