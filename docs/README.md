# Documentation website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

Run these commands from the `docs/` directory. It is a separate npm project, outside the root workspace list, and requires Node.js 26+.

### Installation

```
npm ci
```

### Local Development

```
npm run dev
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```
npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Preview the build

```
npm start
```

This serves the generated `build/` directory locally. Deploy that directory to your static hosting service.

### Validate GraphQL examples

Run against the checked-in API schema without starting a server or database:

```
node --test scripts/validate-graphql.test.mjs
npm run validate:graphql
```

The validator imports the API's SDL source and reads the declared role actions and worker types. It checks executable `graphql`/`gql` fences against that schema, checks SDL excerpts for syntax, and validates standalone fragments against their declared types. Worker examples cover all bundled adapters; your deployment must register the workers it uses.

For a request using custom fields shown on the same page, label its fence `graphql schema=page`. The validator extends the source schema with the page's `/* GraphQL */` SDL templates before checking the request. This still reports unknown fields and invalid operations.

To validate against a configured running server instead, enable introspection and set:

```
GRAPHQL_ENDPOINT=http://localhost:4010/graphql npm run validate:graphql
```

### Continuous integration

[Documentation checks](../.github/workflows/docs.yml) runs the validator tests, GraphQL examples, and Docusaurus production build on documentation or relevant schema changes. The existing Docusaurus configuration fails the build on broken internal links and Markdown links. The check uses only this directory's dependencies; external website availability is not tested.
