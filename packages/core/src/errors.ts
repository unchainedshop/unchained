/**
 * Named service errors: `name` surfaces through API error wrappers (e.g.
 * checkoutCart's OrderCheckoutError -> extensions.detailCode) so clients can
 * react programmatically instead of matching on human-readable messages.
 */
export const createServiceError = (name: string, message: string) => {
  const error = new Error(message);
  error.name = name;
  return error;
};
