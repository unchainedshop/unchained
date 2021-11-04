export const transformOrder = (modules) => (order) => ({
  ...order,
  // Helpers (DEPRECATED)
  country: order.country,
  delivery:order.delivery,
  discounts:order.discounts,
  documents:order.documents,
  enrollment: order.enrollment,
  items:  order.items,
  normalizedStatus: order.normalizedStatus,
  payment: order.payment,
  user: order.user,
  // Transform with modules 
  logs: async ({ limit, offset }) => {
    return await modules.logs.findLogs(
      { 'meta.orderId': order._id },
      {
        skip: offset,
        limit,
        sort: {
          created: -1,
        },
      }
    );
  },
});
