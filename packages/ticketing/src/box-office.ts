import { roles } from '@unchainedshop/api';
import type { UnchainedCore } from '@unchainedshop/core';
import type { Order } from '@unchainedshop/core-orders';
import type { PaymentProvider } from '@unchainedshop/core-payment';

type Modules = UnchainedCore['modules'];

export const BOX_OFFICE_PAYMENT_ADAPTER_KEY = 'shop.unchained.payment.box-office';

/** Staff who sell tickets at the box office: their carts offer the box office payment providers. */
export const SELL_AT_BOX_OFFICE_ACTION = 'sellAtBoxOffice';

interface User {
  _id: string;
  roles?: string[];
  guest?: boolean;
}

/**
 * Whether the user may sell at the box office, derived by the roles engine of the platform
 * (userHasPermission). Used outside of a GraphQL request, where the payment provider filter and the
 * adapter only know the user of the order; the rules get { userId, user, modules } as context.
 */
export async function canSellAtBoxOffice(user: User | null | undefined, modules: Modules) {
  const configuredRoles = roles.getConfiguredRoles();
  if (!user || !configuredRoles) return false;
  return configuredRoles.userHasPermission(
    { userId: user._id, user, modules } as Parameters<typeof configuredRoles.userHasPermission>[0],
    SELL_AT_BOX_OFFICE_ACTION,
    [],
  );
}

export async function canUserSellAtBoxOffice(userId: string | undefined, modules: Modules) {
  if (!userId) return false;
  return canSellAtBoxOffice(await modules.users.findUserById(userId), modules);
}

export const isBoxOfficeProvider = (provider: Pick<PaymentProvider, 'adapterKey'>) =>
  provider.adapterKey === BOX_OFFICE_PAYMENT_ADAPTER_KEY;

type FilterSupportedPaymentProviders = (
  params: { providers: PaymentProvider[]; order: Order },
  unchainedAPI: { modules: Modules },
) => Promise<PaymentProvider[]>;

const boxOfficeFilters = new WeakSet<FilterSupportedPaymentProviders>();

/**
 * Wraps the payment provider filter of a project: customers never get box office providers, staff
 * with sellAtBoxOffice get them first (so a new cart defaults to the box office), followed by the
 * other providers. The project filter then decides on the result.
 */
export function withBoxOfficePaymentProviders(
  filterSupportedProviders?: FilterSupportedPaymentProviders,
): FilterSupportedPaymentProviders {
  if (filterSupportedProviders && boxOfficeFilters.has(filterSupportedProviders)) {
    return filterSupportedProviders;
  }
  const filter: FilterSupportedPaymentProviders = async ({ providers, order }, unchainedAPI) => {
    const boxOffice = providers.filter(isBoxOfficeProvider);
    const others = providers.filter((provider) => !isBoxOfficeProvider(provider));
    const allowed =
      boxOffice.length && (await canUserSellAtBoxOffice(order.userId, unchainedAPI.modules))
        ? [...boxOffice, ...others]
        : others;
    return filterSupportedProviders
      ? filterSupportedProviders({ providers: allowed, order }, unchainedAPI)
      : allowed;
  };
  boxOfficeFilters.add(filter);
  return filter;
}
