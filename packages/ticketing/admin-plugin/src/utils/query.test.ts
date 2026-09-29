import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse, print } from 'graphql';
import { batchQuery, batchResults, batchVariables } from './query.ts';

const EventQuery = parse(/* GraphQL */ `
  query Event($productId: ID!, $locale: Locale) {
    product(productId: $productId) {
      _id
      texts(forceLocale: $locale) {
        title
      }
    }
  }
`);

test('batchQuery loads several ids in one request with the selection of a single-id query', () => {
  assert.equal(
    print(batchQuery(EventQuery, 2)),
    print(
      parse(/* GraphQL */ `
        query Event($productId0: ID!, $locale0: Locale, $productId1: ID!, $locale1: Locale) {
          item0: product(productId: $productId0) {
            _id
            texts(forceLocale: $locale0) {
              title
            }
          }
          item1: product(productId: $productId1) {
            _id
            texts(forceLocale: $locale1) {
              title
            }
          }
        }
      `),
    ),
  );
  // The single-id query is left as it is.
  assert.match(print(EventQuery), /^query Event\(\$productId: ID!, \$locale: Locale\)/);
});

test('batchVariables and batchResults map ids to the batched variables and results', () => {
  assert.deepEqual(batchVariables([{ productId: 'a' }, { productId: 'b' }]), {
    productId0: 'a',
    productId1: 'b',
  });
  assert.deepEqual(batchResults({ item0: { _id: 'a' }, item1: null }, 2), [{ _id: 'a' }, null]);
  assert.deepEqual(batchResults(undefined, 2), [undefined, undefined]);
});
