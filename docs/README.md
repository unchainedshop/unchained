# Documentation website

The documentation site uses [Docusaurus](https://docusaurus.io/). It has its own npm lockfile and is not a root npm workspace. Run the following commands from `docs/`.

## Install and develop

```sh
nvm use
npm ci
npm run dev
```

`npm run dev` starts the development server with live reload.

## Build and preview

```sh
npm run build
npm start
```

The build writes static files to `build/`. `npm start` serves that production build locally. Deploy the contents of `build/` with a static hosting service; this package does not define a `deploy` script.

## Validate GraphQL examples

Start an engine with the relevant plugins enabled, then run:

```sh
npm run validate:graphql
# To use another engine:
GRAPHQL_ENDPOINT=http://localhost:4010/graphql npm run validate:graphql
```

The validator checks fenced `graphql` and `gql` blocks in `docs/` against the running engine's introspection schema. Custom schema examples and intentionally historical migration snippets can need separate review.
