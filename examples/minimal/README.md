# Minimal Example

Minimal headless e-commerce backend using Fastify, Unchained Engine, and the base plugin preset.

Use Node.js 26.8.2 or newer (26.8.2 is pinned) for repository development (see [`.nvmrc`](../../.nvmrc)).

```bash
npx degit unchainedshop/unchained/examples/minimal my-minimal-app
cd my-minimal-app
npm install
# Install the optional static Admin UI and its Fastify dependency
npm install @unchainedshop/admin-ui @fastify/static
npm start
```

The supplied `.env.defaults` starts the server on `http://localhost:4010`, with GraphQL and GraphiQL at `/graphql`. `adminUI: true` serves the installed Admin UI at `/`; without the optional UI package, the adapter serves a fallback landing page.

This minimal example does not seed an administrator or shop data. For a seeded development shop, use the [kitchensink example](../kitchensink/README.md). Set `MONGO_URL` in `.env` to use an external MongoDB instance; local development can use the installed MongoDB Memory Server dependency.
