import type { UnchainedCore } from '@unchainedshop/core';
import type { Currency } from '@unchainedshop/core-currencies';
import DataLoader from 'dataloader';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ isoCode: string }, Currency>(async (queries) => {
    const isoCodes = [...new Set(queries.map((q) => q.isoCode).filter(Boolean))];

    const currencies = await unchainedAPI.modules.currencies.findCurrencies({
      isoCodes,
      includeInactive: true,
    });

    const currencyMap = {};
    for (const currency of currencies) {
      currencyMap[currency.isoCode] = currency;
    }

    return queries.map((q) => currencyMap[q.isoCode]);
  });
