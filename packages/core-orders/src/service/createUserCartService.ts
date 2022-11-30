import { CreateUserCartService } from '@unchainedshop/types/orders';

export const createUserCartService: CreateUserCartService = async (
  { user, orderNumber, countryCode },
  unchainedAPI,
) => {
  const { modules, services } = unchainedAPI;

  const currency = await services.countries.resolveDefaultCurrencyCode(
    {
      isoCode: countryCode,
    },
    unchainedAPI,
  );

  const order = await modules.orders.create({
    userId: user._id,
    orderNumber,
    currency,
    countryCode,
    billingAddress: user.lastBillingAddress || user.profile?.address,
    contact:
      user.lastContact ||
      (!user.guest
        ? {
            telNumber: user.profile?.phoneMobile,
            emailAddress: modules.users.primaryEmail(user)?.address,
          }
        : {}),
  });

  await modules.orders.initProviders(order, unchainedAPI);
  return order;
};
