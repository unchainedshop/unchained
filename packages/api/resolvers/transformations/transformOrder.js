export const transformOrder = (modules) => (order) => ({
  ...order,
  // Helpers (DEPRECATED)
  country: order.country,
  delivery: order.delivery,
  discounts: order.discounts,
  documents: order.documents,
  enrollment: order.enrollment,
  items: order.items,
  normalizedStatus: order.normalizedStatus,
  payment: order.payment,
  user: order.user,
  // Transform with modules
  logs: logs(modules, 'orderId', order),
});
