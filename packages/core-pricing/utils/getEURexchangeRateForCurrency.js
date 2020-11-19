import fetch from 'isomorphic-unfetch';

import Cache from './cache';

const CACHE_PERIOD = 60 * 60 * 0.5; // 30 minutes

const cache = new Cache(CACHE_PERIOD);
const xmlJs = require('xml-js');

const getEURexchangeRateForCurrency = async (currency) => {
  const response = cache.get(currency, () =>
    fetch(`https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml`, {
      method: 'GET',
    })
      .then((res) => res.text())
      .then((text) => JSON.parse(xmlJs.xml2json(text)))
      .then(
        (json) =>
          json.elements?.[0]?.elements
            .filter((e) => e.name.toLowerCase() === 'cube')[0]
            ?.elements[0]?.elements.filter(
              (a) => a.attributes.currency === currency
            )?.[0]?.attributes
      )
  );
  return response;
};

export default getEURexchangeRateForCurrency;
