import { describe, it } from 'node:test';
import assert from 'node:assert';
import createGraphQLServer, { type GraphQLServerOptions } from './createGraphQLServer.ts';

const post = async (query: string, options: Partial<GraphQLServerOptions> = { logging: false }) => {
  const server = await createGraphQLServer({
    typeDefs: [
      /* GraphQL */ `
        type Query {
          echo(n: Int): String
          drafts(limit: Int = 10, includeDrafts: Boolean = false): String
        }
      `,
    ],
    resolvers: [{ Query: { drafts: (_root, args) => JSON.stringify(args) } }],
    ...options,
  });
  const response = await server.fetch('http://localhost/graphql', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  return response.json();
};

describe('createGraphQLServer', () => {
  it('reports each validation error once', async () => {
    const { errors } = await post('{ unknown echo(n: "x") }');
    assert.strictEqual(errors.length, 2);
  });

  it('applies argument defaults for variables that are not provided', async () => {
    const { data } = await post(
      'query ($limit: Int, $includeDrafts: Boolean) { drafts(limit: $limit, includeDrafts: $includeDrafts) }',
    );
    assert.deepStrictEqual(JSON.parse(data.drafts), { limit: 10, includeDrafts: false });
  });

  it('serves requests with the capitalized LOG_LEVEL values the docs list', async (t) => {
    const { LOG_LEVEL } = process.env;
    t.after(() => {
      if (LOG_LEVEL === undefined) delete process.env.LOG_LEVEL;
      else process.env.LOG_LEVEL = LOG_LEVEL;
    });
    process.env.LOG_LEVEL = 'Info';
    const { data } = await post('{ drafts }', {});
    assert.deepStrictEqual(JSON.parse(data.drafts), { limit: 10, includeDrafts: false });
  });
});
