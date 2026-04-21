import type { UnchainedCore } from '@unchainedshop/core';
import type { Enrollment } from '@unchainedshop/core-enrollments';
import DataLoader from 'dataloader';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ orderId: string }, Enrollment | null>(async (queries) => {
    const orderIds = [...new Set(queries.map((q) => q.orderId).filter(Boolean))];
    const requestedOrderIds = new Set(orderIds);

    const enrollments = await unchainedAPI.modules.enrollments.findEnrollmentsByOrderIds({
      orderIds,
    });

    const enrollmentMap: Record<string, Enrollment> = {};
    for (const enrollment of enrollments) {
      for (const period of enrollment.periods || []) {
        if (period.orderId && requestedOrderIds.has(period.orderId) && !enrollmentMap[period.orderId]) {
          enrollmentMap[period.orderId] = enrollment;
        }
      }
    }

    return queries.map((q) => enrollmentMap[q.orderId] ?? null);
  });
