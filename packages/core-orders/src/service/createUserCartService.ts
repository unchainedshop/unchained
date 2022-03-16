import { CreateUserCartService } from '@unchainedshop/types/orders';

export const createUserCartService: CreateUserCartService = async (
  { user, orderNumber, countryCode },
  requestContext,
) => {
  const { countryContext, modules, services } = requestContext;

  const normalizedCountryCode = countryCode || countryContext;

  const currency = await services.countries.resolveDefaultCurrencyCode(
    {
      isoCode: normalizedCountryCode,
    },
    requestContext,
  );

  const order = await modules.orders.create(
    {
      orderNumber,
      currency,
      countryCode: normalizedCountryCode,
      billingAddress: user.lastBillingAddress || user.profile?.address,
      contact:
        user.lastContact ||
        (!user.guest
          ? {
              telNumber: user.profile?.phoneMobile,
              emailAddress: modules.users.primaryEmail(user)?.address,
            }
          : {}),
    },
    user._id,
  );

  await modules.orders.initProviders(order._id, requestContext);
  return order;
};
