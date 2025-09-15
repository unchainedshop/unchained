---
sidebar_position: 5
sidebar_label: Use Pothos to extend Unchained
title: Use Pothos to extend Unchained

---

To use a graphql library like [Pothos](https://pothos-graphql.dev/), unchained supports providing a complete custom schema to the GraphQL Yoga Server. This is done by using `mergeExecutableSchema` combining the Pothos schema with the Unchained schema.

```ts
import { buildDefaultTypeDefs } from '@unchainedshop/api/lib/schema/index.js';
import unchainedResolvers from '@unchainedshop/api/lib/resolvers/index.js';
import { makeExecutableSchema, mergeSchemas } from '@graphql-tools/schema';
import SchemaBuilder from '@pothos/core';
import { startPlatform } from '@unchainedshop/platform';
import { roles } from '@unchainedshop/api';

const unchained = makeExecutableSchema({
    typeDefs: buildDefaultTypeDefs({
        actions: Object.keys(roles.actions),
    }),
    resolvers: [unchainedResolvers],
});

const builder = new SchemaBuilder({});

builder.queryType({
  fields: (t) => ({
    hello: t.string({
      args: {
        name: t.arg.string(),
      },
      resolve: (parent, { name }, unchainedContext) => `hello, ${name || 'World'}`,
    }),
  }),
});

const schema = await mergeSchemas({
    schemas: [unchained, builder.toSchema()],
});

const engine = await startPlatform({
  schema,
});
```