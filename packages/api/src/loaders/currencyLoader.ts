import type { UnchainedCore } from '@unchainedshop/core';
import type { Currency } from '@unchainedshop/core-currencies';
import DataLoader from 'dataloader';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ isoCode: string }, Currency>(async (queries) => {
    const currencies = await unchainedAPI.modules.currencies.allCurrencies();
    return queries.map(
      ({ isoCode }) =>
        currencies.find((currency) => !currency.deleted && currency.isoCode === isoCode) as Currency,
    );
  });
