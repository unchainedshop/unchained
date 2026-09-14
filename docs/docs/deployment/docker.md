---
sidebar_position: 2
title: Docker Deployment
sidebar_label: Docker
description: Build and run Unchained Engine, Admin UI, and documentation images
---

# Docker Deployment

The checked-in Dockerfiles build from the **repository root**. Engine examples and Admin UI use the root npm lockfile with workspace paths preserved. The documentation site has its own lockfile under `docs/`.

## Build Images

Run these commands from the repository root:

```bash
# Fastify engine with the built-in Admin UI
docker build -f examples/kitchensink/Dockerfile -t unchained-kitchensink .

# Other engine examples
docker build -f examples/kitchensink-express/Dockerfile -t unchained-express .
docker build -f examples/minimal/Dockerfile -t unchained-minimal .
docker build -f examples/ticketing/Dockerfile -t unchained-ticketing .
docker build -f examples/oidc/Dockerfile -t unchained-oidc .

# Standalone static sites
docker build -f admin-ui/Dockerfile -t unchained-admin .
docker build -f docs/Dockerfile -t unchained-docs .
```

All application images expose container port `3000`. Node build and engine runtime stages use Node.js `26.8.2`. Static Admin UI and documentation images serve compiled files with nginx; they do not run Next.js or the Docusaurus development server.

The root `Dockerfile` builds the separate CI image, including MongoDB for integration tests. It is not the production engine entry point:

```bash
docker build -t unchained-ci .
docker run --rm unchained-ci npm run lint:check
docker run --rm unchained-ci npm test
```

## Run an Engine with MongoDB

The engine images retain the example's `.env.defaults`; override development credentials and public URLs for your deployment. MongoDB must be reachable through `MONGO_URL` in production.

This Compose example runs the Fastify kitchensink on host port `4010`, with its Admin UI at `/` and GraphQL at `/graphql`:

```yaml
services:
  engine:
    build:
      context: .
      dockerfile: examples/kitchensink/Dockerfile
    ports:
      - "4010:3000"
    environment:
      ROOT_URL: http://localhost:4010
      MONGO_URL: mongodb://mongo:27017/unchained
      UNCHAINED_TOKEN_SECRET: ${UNCHAINED_TOKEN_SECRET:?Set a session secret of at least 32 characters}
      UNCHAINED_SECRET: ${UNCHAINED_SECRET:?Set an application secret}
      UNCHAINED_SEED_PASSWORD: ${UNCHAINED_SEED_PASSWORD:?Set an initial administrator password}
      EMAIL_WEBSITE_URL: http://localhost:4010
      EMAIL_WEBSITE_NAME: My Shop
      EMAIL_FROM: shop@example.com
    depends_on:
      mongo:
        condition: service_healthy
    restart: unless-stopped

  mongo:
    image: mongo:8.2.12
    volumes:
      - mongo_data:/data/db
    healthcheck:
      test: ["CMD", "mongosh", "--quiet", "--eval", "quit(db.adminCommand('ping').ok ? 0 : 1)"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  mongo_data:
```

Supply the variables in your shell or a local `.env` file, then run:

```bash
docker compose up --build -d
docker compose logs -f engine
docker compose down
```

The examples are starting points: kitchensink, Express, ticketing, and OIDC generate and log an administrator access token during boot. Review their boot and seed scripts before exposing a production service. Ticketing callbacks are placeholders, and OIDC additionally requires a configured identity provider.

The engine runs as the image's `node` user. Give that user access to any mounted files your adapters need, including certificates and uploaded-file storage.

## Standalone Admin UI

The exported Admin UI defaults to same-origin API paths. If you serve it on a separate origin, set its public URLs **during the Docker build**:

```bash
docker build -f admin-ui/Dockerfile -t unchained-admin \
  --build-arg NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://engine.example.com/graphql \
  --build-arg NEXT_PUBLIC_CHAT_URL=https://engine.example.com/chat \
  --build-arg NEXT_PUBLIC_TEMP_FILE_UPLOAD_URL=https://engine.example.com/temp-upload \
  --build-arg NEXT_PUBLIC_LOGO=https://cdn.example.com/logo.svg \
  .
docker run --rm -p 4011:3000 unchained-admin
```

The browser must be able to reach these URLs. A Compose service name such as `engine` is normally only resolvable inside the Docker network. Configure the API's CORS and cookie settings for your frontend origin.

Setting `NEXT_PUBLIC_*` with `docker run -e` does not change already compiled assets. To use the default same-origin paths, route `/graphql`, `/chat`, and `/temp-upload` to the engine in your external reverse proxy. The image serves the routes produced by `next.config.js`, including directory indexes and static assets.

## Documentation Site

```bash
docker build -f docs/Dockerfile -t unchained-docs \
  --build-arg GIT_COMMIT="$(git rev-parse HEAD)" .
docker run --rm -p 4012:3000 unchained-docs
```

The static site is available at `http://localhost:4012`. Its `/version` file contains the supplied commit identifier. `docs/Dockerfile.dockerignore` includes the docs source and shared nginx configuration while excluding local dependencies and generated artifacts.

## Health Checks and Smoke Tests

Engine health checks POST `{ shopInfo { _id } }` to the configured `GRAPHQL_API_PATH` (default `/graphql`) on `PORT` (default `3000`). Both HTTP errors and GraphQL errors make the check fail. Static-site checks request the site's root page.

The normal `npm test` command includes healthcheck regression tests. Run them separately without Docker:

```bash
npm run test:run:docker
```

After building the static images, run their container smoke tests:

```bash
node docker/smoke-static.mjs unchained-admin /products/
node docker/smoke-static.mjs unchained-docs /concepts/architecture
```

The smoke tests wait for Docker health status, check root and nested HTML routes, load JavaScript assets, and verify that unknown paths return HTTP 404. They remove their temporary containers when finished.

Inspect a running engine's health and logs with:

```bash
docker inspect --format '{{json .State.Health}}' CONTAINER
docker logs CONTAINER
```

## Build Context and Dependencies

The root `.dockerignore` excludes local dependencies, workspace build output, local environment overrides, and `.context/`. Keep the tracked example defaults and the Admin UI's public defaults in the build context.

Engine builds install development dependencies for compilation, then prune them before copying the runtime dependencies and workspaces into the final image. Build and lint failures stop the image build. Admin UI uses the monorepo dependency tree only in its builder stage; documentation uses its own locked dependency tree. Their nginx runtime stages contain only static assets and server configuration.

## Related

- [Environment Variables](../platform-configuration/environment-variables.md)
- [Security](./security.md)
- [Admin UI](../admin-ui/overview.md)
