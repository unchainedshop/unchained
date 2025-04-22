import { UnchainedCore } from '@unchainedshop/core';
import { Currency } from '@unchainedshop/core-currencies';
import DataLoader from 'dataloader';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ isoCode: string }, Currency>(async (queries) => {
    const isoCodes = [...new Set(queries.map((q) => q.isoCode).filter(Boolean))]; // you don't need lodash, _.unique my ass

    const currencies = await unchainedAPI.modules.currencies.findCurrencies({
      isoCode: { $in: isoCodes },
      includeInactive: true,
    });

    const currencyMap = {};
    for (const currency of currencies) {
      currencyMap[currency._id] = currency;
    }

    return queries.map((q) => currencyMap[q.isoCode]);
  });
