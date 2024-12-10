import { IWorkerAdapter, WorkerAdapter, WorkerDirector } from '@unchainedshop/core';
import later from '@breejs/later';
import { xml2json } from 'xml-js';
import { ProductPriceRate } from '@unchainedshop/core-products';

const getExchangeRates = async () => {
  return fetch(`https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml`, {
    method: 'GET',
  })
    .then((res) => res.text())
    .then((text) => JSON.parse(xml2json(text)))
    .then((json) =>
      json.elements?.[0]?.elements
        .filter((e) => e.name.toLowerCase() === 'cube')[0]
        ?.elements[0]?.elements.map((element) => element.attributes),
    );
};

// https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html
// CET = UTC + 1
const everyDayAtFour = later.parse.cron('0 15 * * *');

const baseCurrency = 'EUR';

const UpdateECBRates: IWorkerAdapter<any, any> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker.update-ecb-rates',
  label: 'Update ECB Rates',
  version: '1.0.0',
  type: 'UPDATE_ECB_RATES',

  doWork: async (input, unchainedAPI) => {
    const { modules } = unchainedAPI;

    try {
      const data: Array<{ currency: string; rate: string }> = await getExchangeRates();
      const timestamp = new Date();
      const expiresAt = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);

      const currencies = await modules.currencies.findCurrencies({ includeInactive: true });
      const currencyCodes = currencies.map((currency) => currency.isoCode);

      if (!currencyCodes.includes(baseCurrency))
        return {
          success: true,
          result: {
            ratesUpdated: 0,
            info: 'EUR not enabled',
          },
        };

      const rates: Array<ProductPriceRate> = data
        .map((d) => {
          return {
            baseCurrency,
            quoteCurrency: d.currency,
            rate: parseFloat(d.rate),
            timestamp,
            expiresAt,
          };
        })
        .filter(
          (rate) =>
            currencyCodes.includes(rate.quoteCurrency) && rate.quoteCurrency !== rate.baseCurrency,
        );

      const success = await modules.products.prices.rates.updateRates(rates);
      return {
        success,
        result: {
          ratesUpdated: rates.length,
        },
      };
    } catch {
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

WorkerDirector.configureAutoscheduling({
  type: UpdateECBRates.type,
  schedule: everyDayAtFour,
  retries: 5,
});
