import fetch from 'isomorphic-unfetch';

import Cache from './cache';

const CACHE_PERIOD = 60 * 60 * 0.1; // 10 minutes

const cache = new Cache(CACHE_PERIOD);

const getFiatexchangeRateForCrypto = async (base, target) => {
  const { data } = await cache.get(`${base}-${target}`, () =>
    fetch(`https://api.coinbase.com/v2/exchange-rates?currency=${base}`, {
      method: 'GET',
    }).then((res) => res.json())
  );
  return data?.rates?.[target];
};

export default getFiatexchangeRateForCrypto;
