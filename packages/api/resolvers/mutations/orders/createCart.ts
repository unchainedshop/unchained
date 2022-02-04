import { log } from 'meteor/unchained:logger';
import { Root, Context } from '@unchainedshop/types/api';
import { OrderNumberAlreadyExistsError } from '../../../errors';

export default async function createCart(
  root: Root,
  { orderNumber }: { orderNumber: string },
  context: Context,
) {
  const { modules, services, countryContext, userId, user } = context;
  log('mutation createCart', { userId });

  const order = await modules.orders.findOrder({ orderNumber });
  if (order) throw new OrderNumberAlreadyExistsError({ orderNumber });

  const currency = await services.countries.resolveDefaultCurrencyCode(
    {
      isoCode: countryContext,
    },
    context,
  );

  return modules.orders.create(
    {
      orderNumber,
      currency,
      countryCode: countryContext,
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
    userId,
  );
}
