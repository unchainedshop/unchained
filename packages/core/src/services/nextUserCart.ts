import { resolveBestCurrency } from '@unchainedshop/utils';
import { User } from '@unchainedshop/core-users';
import { ordersSettings } from '@unchainedshop/core-orders';
import { initCartProvidersService } from './initCartProviders.js';
import { Modules } from '../modules.js';

export async function nextUserCartService(
  this: Modules,
  {
    user,
    orderNumber,
    countryCode,
    forceCartCreation,
  }: {
    user: User;
    orderNumber?: string;
    countryCode?: string;
    forceCartCreation?: boolean;
  },
) {
  const cart = await this.orders.cart({
    countryContext: countryCode || user.lastLogin?.countryCode,
    orderNumber,
    userId: user._id,
  });
  if (cart) return cart;

  const shouldCreateNewCart = forceCartCreation || ordersSettings.ensureUserHasCart;
  if (!shouldCreateNewCart) return null;

  const countryObject = await this.countries.findCountry({ isoCode: countryCode });
  const currencies = await this.currencies.findCurrencies({ includeInactive: false });
  const currency = resolveBestCurrency(countryObject.defaultCurrencyCode, currencies);

  const order = await this.orders.create({
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
            emailAddress: this.users.primaryEmail(user)?.address,
          }
        : {}),
  });

  return initCartProvidersService.bind(this)(order);
}
