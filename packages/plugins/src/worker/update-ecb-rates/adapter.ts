import { type IWorkerAdapter, WorkerAdapter, WorkerDirector, schedule } from '@unchainedshop/core';
import type { ProductPriceRate } from '@unchainedshop/core-products';

interface FrankfurterRate {
  quote: string;
  rate: number;
}

const baseCurrency = 'EUR';

// ECB euro reference rates as JSON, served by https://frankfurter.dev
const getExchangeRates = async (): Promise<FrankfurterRate[]> => {
  const res = await fetch(`https://api.frankfurter.dev/v2/rates?base=${baseCurrency}&providers=ecb`);
  if (!res.ok) throw new Error(`Frankfurter responded with HTTP ${res.status}`);
  const rates = (await res.json()) as FrankfurterRate[];
  // Frankfurter answers an unknown provider with an empty list instead of an error
  if (!rates?.length) throw new Error('Frankfurter returned no ECB rates');
  return rates;
};

// https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html
// CET = UTC + 1
const everyDayAtFour = schedule.parse.cron('0 15 * * *');

export const UpdateECBRates: IWorkerAdapter<any, any> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker.update-ecb-rates',
  label: 'Update ECB Rates',
  version: '1.0.0',
  type: 'UPDATE_ECB_RATES',

  doWork: async (input, unchainedAPI) => {
    const { modules } = unchainedAPI;

    try {
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

      const data = await getExchangeRates();
      const timestamp = new Date();
      const expiresAt = new Date(timestamp.getTime() + 24 * 60 * 60 * 1000);

      const rates: ProductPriceRate[] = data
        .map((d) => {
          return {
            baseCurrency,
            quoteCurrency: d.quote,
            rate: d.rate,
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
    } catch (err) {
      return {
        success: false,
        error: {
          name: 'UPDATE_ECB_RATES_FAILED',
          message: `Updating ECB Rates failed: ${err.message}`,
        },
      };
    }
  },
};

export default UpdateECBRates;

export const configureUpdateECBRatesAutoscheduling = () => {
  WorkerDirector.configureAutoscheduling({
    type: UpdateECBRates.type,
    schedule: everyDayAtFour,
    retries: 5,
  });
};
