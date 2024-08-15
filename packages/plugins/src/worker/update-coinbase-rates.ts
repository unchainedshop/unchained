/// <reference lib="dom" />
import { IWorkerAdapter } from '@unchainedshop/types/worker.js';
import { WorkerAdapter, WorkerDirector } from '@unchainedshop/core-worker';
import later from '@breejs/later';
import { ProductPriceRate } from '@unchainedshop/types/products.pricing.js';
import { resolveBestCurrency } from '@unchainedshop/utils';

const getExchangeRates = async (base) => {
  return fetch(`https://api.coinbase.com/v2/exchange-rates?currency=${base}`, {
    method: 'GET',
  })
    .then((res) => res.json())
    .then((r) => r?.data);
};

const everyMinute = later.parse.cron('* * * * *');

const UpdateCoinbaseRates: IWorkerAdapter<any, any> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker.update-coinbase-rates',
  label: 'Update Coinbase Rates',
  version: '1.0.0',
  type: 'UPDATE_COINBASE_RATES',

  doWork: async (input, unchainedAPI) => {
    try {
      const currencies = await unchainedAPI.modules.currencies.findCurrencies({ includeInactive: true });
      const currencyCode = resolveBestCurrency(null, currencies); // Get fallback currency

      const currencyCodes = currencies.map((currency) => currency.isoCode);

      const {
        currency: baseCurrency,
        rates: pairs,
      }: { currency: string; rates: Record<string, string> } = await getExchangeRates(currencyCode);
      const timestamp = new Date();

      // five minutes
      const expiresAt = new Date(new Date().getTime() + 5 * 60 * 1000);

      const rates: Array<ProductPriceRate> = Object.entries(pairs)
        .map(([quoteCurrency, rate]) => {
          return {
            baseCurrency,
            quoteCurrency,
            rate: parseFloat(rate),
            timestamp,
            expiresAt,
          };
        })
        .filter(
          (rate) =>
            currencyCodes.includes(rate.quoteCurrency) && rate.quoteCurrency !== rate.baseCurrency,
        );

      const success = await unchainedAPI.modules.products.prices.rates.updateRates(rates);
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
          name: 'UPDATE_COINBASE_RATES_FAILED',
          message: 'Updating Coinbase Rates failed',
        },
      };
    }
  },
};

WorkerDirector.registerAdapter(UpdateCoinbaseRates);

WorkerDirector.configureAutoscheduling({
  type: UpdateCoinbaseRates.type,
  schedule: everyMinute,
});
