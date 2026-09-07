/**
 * Named service errors: `name` surfaces through API error wrappers (e.g.
 * checkoutCart's OrderCheckoutError -> extensions.detailCode) so clients can
 * react programmatically instead of matching on human-readable messages.
 */
export const createServiceError = <TDetails extends Record<string, unknown> = Record<string, never>>(
  name: string,
  message: string,
  details?: TDetails,
) => {
  const error = new Error(message);
  error.name = name;
  return Object.assign(error, details === undefined ? {} : { details });
};
