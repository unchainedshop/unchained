import { IWorkerAdapter } from '@unchainedshop/types/worker';
import { WorkerAdapter, WorkerDirector } from '@unchainedshop/core-worker';
import later from '@breejs/later';
import xmlJs from 'xml-js';
import fetch from 'node-fetch';
import { ProductPriceRate } from '@unchainedshop/types/products.pricing';

const getExchangeRates = async () => {
  return fetch(`https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml`, {
    method: 'GET',
  })
    .then((res) => res.text())
    .then((text) => JSON.parse(xmlJs.xml2json(text)))
    .then((json) =>
      json.elements?.[0]?.elements
        .filter((e) => e.name.toLowerCase() === 'cube')[0]
        ?.elements[0]?.elements.map((element) => element.attributes),
    );
};

const everySixHours = later.parse.text('every 6 hours');

const UpdateECBRates: IWorkerAdapter<any, any> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker.update-ecb-rates',
  label: 'Update ECB Rates',
  version: '1.0',
  type: 'UPDATE_ECB_RATES',

  doWork: async (input, requestContext) => {
    const { modules } = requestContext;

    try {
      const data: Array<{ currency: string; rate: string }> = await getExchangeRates();
      const timestamp = new Date();
      const expiresAt = new Date(new Date().getTime() + 12 * 60 * 60 * 1000);

      const rates: Array<ProductPriceRate> = data.map((d) => {
        return {
          baseCurrency: 'EUR',
          quoteCurrency: d.currency,
          rate: parseFloat(d.rate),
          timestamp,
          expiresAt,
        };
      });

      const success = await modules.products.prices.rates.updateRates(rates);
      return {
        success,
      };
    } catch (e) {
      return {
        success: false,
        error: {
          name: 'UPDATE_ECB_RATES_FAILED',
          message: 'Updating ECB Rates failed',
        },
      };
    }
  },
};

WorkerDirector.registerAdapter(UpdateECBRates);

WorkerDirector.configureAutoscheduling(UpdateECBRates, {
  schedule: everySixHours,
  input: () => {
    /* */
  },
});