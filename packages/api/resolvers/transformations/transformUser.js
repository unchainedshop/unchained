
export const transformUser = (modules) => (user) => ({
  ...user,
  // Helper (DEPRECATED)
  avatar: user.avatar,
  cart: user.cart,
  country: user.country,
  email: user.email,
  enrollments: user.enrollments,
  isEmailVerified: user.isEmailVerified,
  isGuest: user.isGuest,
  isInitialPassword: user.isInitialPassword,
  isTwoFactorEnabled: user.isTwoFactorEnabled,
  language: user.language,
  orders: user.orders,
  primaryEmail: user.primaryEmail,
  quotations: user.quotations,
  // Transform with modules
  logs: logs(modules, 'userId', user),
});