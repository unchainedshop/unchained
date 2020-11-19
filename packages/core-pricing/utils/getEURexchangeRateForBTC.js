import fetch from 'isomorphic-unfetch';

import Cache from './cache';

const CACHE_PERIOD = 60 * 60 * 0.1; // 10 minutes

const cache = new Cache(CACHE_PERIOD);

const getEURexchangeRateForBTC = async (currency) => {
  const { data } = await cache.get(currency, () =>
    fetch(`https://api.coinbase.com/v2/exchange-rates?currency=EUR`, {
      method: 'GET',
    }).then((res) => res.json())
  );
  return data?.rates?.[currency];
};

export default getEURexchangeRateForBTC;
