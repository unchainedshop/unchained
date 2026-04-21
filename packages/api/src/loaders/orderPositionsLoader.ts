import type { UnchainedCore } from '@unchainedshop/core';
import type { OrderPosition } from '@unchainedshop/core-orders';
import DataLoader from 'dataloader';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ orderId: string }, OrderPosition[]>(async (queries) => {
    const orderIds = [...new Set(queries.map((q) => q.orderId).filter(Boolean))];

    const positions = await unchainedAPI.modules.orders.positions.findOrderPositions({
      orderIds,
    });

    const positionsMap: Record<string, OrderPosition[]> = {};
    for (const position of positions) {
      if (!positionsMap[position.orderId]) {
        positionsMap[position.orderId] = [position];
      } else {
        positionsMap[position.orderId].push(position);
      }
    }

    return queries.map((q) => positionsMap[q.orderId] || []);
  });
