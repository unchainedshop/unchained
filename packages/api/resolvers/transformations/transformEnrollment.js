import { logs } from "./helpers/logs";

export const transformEnrollment = (modules) => (enrollment) => ({
  ...enrollment,
  // Helpers (DEPRECATED)
  country: enrollment.country,
  currency: enrollment.currency,
  isExpired: enrollment.isExpired,
  user: enrollment.user,
  // Transform with modules
  logs: logs(modules, 'enrollmentId', enrollment),
});
