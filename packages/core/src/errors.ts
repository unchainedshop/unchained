/**
 * Named service errors: `name` surfaces through API error wrappers (e.g.
 * checkoutCart's OrderCheckoutError -> extensions.detailCode) so clients can
 * react programmatically instead of matching on human-readable messages.
 */
export const createServiceError = (name: string, message: string, details?: Record<string, unknown>) => {
  const error = Object.assign(new Error(message), { details });
  error.name = name;
  return error;
};
