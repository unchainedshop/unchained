import type { UnchainedCore } from '@unchainedshop/core';
import type { Country } from '@unchainedshop/core-countries';
import DataLoader from 'dataloader';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ isoCode: string }, Country>(async (queries) => {
    const isoCodes = [...new Set(queries.map((q) => q.isoCode).filter(Boolean))];

    const countries = await unchainedAPI.modules.countries.findCountries({
      isoCodes,
      includeInactive: true,
    });

    const countryMap = {};
    for (const country of countries) {
      countryMap[country.isoCode] = country;
    }

    return queries.map((q) => countryMap[q.isoCode]);
  });
