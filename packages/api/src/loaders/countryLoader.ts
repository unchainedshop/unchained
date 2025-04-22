import { UnchainedCore } from '@unchainedshop/core';
import { Country } from '@unchainedshop/core-countries';
import DataLoader from 'dataloader';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ isoCode: string }, Country>(async (queries) => {
    const isoCodes = [...new Set(queries.map((q) => q.isoCode).filter(Boolean))]; // you don't need lodash, _.unique my ass

    const countries = await unchainedAPI.modules.countries.findCountries({
      isoCode: { $in: isoCodes },
      includeInactive: true,
    });

    const countryMap = {};
    for (const country of countries) {
      countryMap[country._id] = country;
    }

    return queries.map((q) => countryMap[q.isoCode]);
  });
