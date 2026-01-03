import type { Modules } from '../modules.ts';
import { SearchDirector, SearchEntityType } from '../directors/index.ts';
import type { PaymentProviderQuery } from '@unchainedshop/core-payment';

export async function searchPaymentProvidersService(
  this: Modules,
  queryString?: string,
  query: PaymentProviderQuery = {},
) {
  if (!queryString) {
    return this.payment.paymentProviders.findProviders(query);
  }

  const searchActions = SearchDirector.actions({ queryString }, { modules: this });
  const searchPaymentProviderIds = await searchActions.search(SearchEntityType.PAYMENT_PROVIDER);
  if (searchPaymentProviderIds.length === 0) return [];

  return this.payment.paymentProviders.findProviders({ ...query, searchPaymentProviderIds });
}

export async function searchPaymentProvidersCountService(
  this: Modules,
  queryString?: string,
  query: PaymentProviderQuery = {},
) {
  if (!queryString) {
    return this.payment.paymentProviders.count(query);
  }

  const searchActions = SearchDirector.actions({ queryString }, { modules: this });
  const searchPaymentProviderIds = await searchActions.search(SearchEntityType.PAYMENT_PROVIDER);
  if (searchPaymentProviderIds.length === 0) return 0;

  return this.payment.paymentProviders.count({ ...query, searchPaymentProviderIds });
}
