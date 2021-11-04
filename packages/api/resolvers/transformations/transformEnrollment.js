export const transformEnrollment = (modules) => (enrollment) => ({
  ...enrollment,
  // Helpers (DEPRECATED)
  country: enrollment.country,
  currency: enrollment.currency,
  isExpired: enrollment.isExpired,
  user: enrollment.user,
  // Transform with modules
  logs: async ({ limit, offset }) => {
    return await modules.logs.findLogs(
      { 'meta.enrollmentId': enrollment._id },
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
