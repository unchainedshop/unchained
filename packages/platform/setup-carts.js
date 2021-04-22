import { Orders } from 'meteor/unchained:core-orders';

const {
  UNCHAINED_INVALIDATE_PROVIDERS = true,
  UNCHAINED_ASSIGN_CART_FOR_USERS = false,
} = process.env;

const isProviderInvalidationEnabled = (options) => {
  return options?.invalidateProviders ?? !!UNCHAINED_INVALIDATE_PROVIDERS;
};

const isAssignCartEnabled = (options) => {
  return options?.assignCartForUsers ?? !!UNCHAINED_ASSIGN_CART_FOR_USERS;
};

export default async function setupCarts(options) {
  if (isProviderInvalidationEnabled(options)) {
    await Orders.invalidateProviders();
  }
  if (isAssignCartEnabled(options)) {
    await Orders.assignCartForExistingUsers();
  }
}
