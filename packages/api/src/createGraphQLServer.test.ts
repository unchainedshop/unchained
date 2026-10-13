import { describe, it } from 'node:test';
import assert from 'node:assert';
import createGraphQLServer from './createGraphQLServer.ts';

const post = async (query: string) => {
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
    logging: false,
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
});
