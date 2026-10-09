import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { configureOrderPositionsModule } from './configureOrderPositionsModule.ts';

describe('configureOrderPositionsModule', () => {
  it('restores the previous positions if inserting a replacement fails', async () => {
    const previousPositions = [
      {
        _id: 'previous-id',
        orderId: 'order-id',
        productId: 'product-id',
        originalProductId: 'product-id',
        quantity: 2,
      },
    ];
    const replacementError = new Error('replacement failed');
    let insertionAttempt = 0;
    const insertMany = mock.fn(async () => {
      if (insertionAttempt++ === 0) throw replacementError;
    });
    const deleteMany = mock.fn(async () => ({ deletedCount: 1 }));
    const positions = configureOrderPositionsModule({
      OrderPositions: {
        find: mock.fn(() => ({ toArray: async () => previousPositions })),
        deleteMany,
        insertMany,
      } as any,
    });

    await assert.rejects(
      positions.replaceProductItems({
        orderId: 'order-id',
        items: [
          {
            originalProductId: 'replacement-id',
            productId: 'replacement-id',
            quantity: 1,
          },
        ],
      }),
      replacementError,
    );

    assert.equal(deleteMany.mock.calls.length, 2);
    assert.equal(insertMany.mock.calls.length, 2);
    assert.deepEqual(insertMany.mock.calls[1].arguments[0], previousPositions);
  });
});
