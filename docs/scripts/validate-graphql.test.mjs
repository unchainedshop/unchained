import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSourceSchema, extractGraphQLBlocks, validateExample } from './validate-graphql.mjs';

const schema = buildSourceSchema();
const check = (code, metadata = '', page = '') => validateExample({ code, metadata }, schema, page);

test('extracts gql/graphql fences with metadata and reports their source line', () => {
  const blocks = extractGraphQLBlocks('Intro\n\n```gql schema=page\n{ me { _id } }\n```\n\n```graphql\n{ shopInfo { _id } }\n```\n');
  assert.deepEqual(blocks.map(({ line, metadata }) => ({ line, metadata })), [
    { line: 3, metadata: 'schema=page' }, { line: 7, metadata: '' },
  ]);
});

test('accepts real API operations and worker types, rejects stale fields and enums', () => {
  assert.equal(check('{ me { _id } }').length, 0);
  assert.equal(check('mutation { addWork(type: EMAIL) { _id } }').length, 0);
  assert.ok(check('{ me { nonexistentField } }').length);
  assert.ok(check('mutation { addWork(type: NONEXISTENT_WORKER) { _id } }').length);
  assert.throws(() => check('query {'), /Syntax Error/);
});

test('checks SDL syntax and standalone fragments without treating them as operations', () => {
  assert.equal(check('extend type SimpleProduct { customLabel: String }').length, 0);
  assert.throws(() => check('type Broken {'), /Syntax Error/);
  assert.equal(check('fragment UserIdentity on User { _id }').length, 0);
  assert.ok(check('fragment UserIdentity on User { nonexistentField }').length);
});

test('custom operations require the page extension and still reject incorrect fields', () => {
  const page = 'const typeDefs = /* GraphQL */ `extend type SimpleProduct { customLabel: String }`;';
  const operation = '{ product(productId: "p") { ... on SimpleProduct { customLabel } } }';
  assert.ok(check(operation).length);
  assert.equal(check(operation, 'schema=page', page).length, 0);
  assert.ok(check(operation.replace('customLabel', 'missingLabel'), 'schema=page', page).length);
  assert.throws(() => check(operation, 'schema=page'), /requires a/);
  assert.throws(() => check(operation, 'schema=unknown', page), /Unknown schema mode/);
});
