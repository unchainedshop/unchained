import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import { configureOrdersModuleQueries } from './configureOrdersModule-queries.ts';

describe('configureOrdersModuleQueries', () => {
  it('applies pagination options to text searches', async () => {
    const toArray = mock.fn(async () => []);
    const find = mock.fn(() => ({ toArray }));
    const queries = configureOrdersModuleQueries({
      Orders: { find } as any,
    });

    await queries.findOrders({ queryString: 'needle', limit: 5, offset: 10 });

    assert.strictEqual(find.mock.calls.length, 1);
    assert.deepStrictEqual(find.mock.calls[0].arguments[1], {
      skip: 10,
      limit: 5,
      sort: { score: { $meta: 'textScore' } },
      projection: { score: { $meta: 'textScore' } },
    });
    assert.strictEqual(toArray.mock.calls.length, 1);
  });
});
