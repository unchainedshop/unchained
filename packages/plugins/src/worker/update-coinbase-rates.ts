import { IWorkerAdapter } from '@unchainedshop/types/worker';
import { WorkerAdapter, WorkerDirector } from '@unchainedshop/core-worker';
import later from '@breejs/later';
import fetch from 'node-fetch';
import { ProductPriceRate } from '@unchainedshop/types/products.pricing';

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
  version: '1.0',
  type: 'UPDATE_COINBASE_RATES',

  doWork: async (input, requestContext) => {
    const { modules } = requestContext;

    try {
      const currencyCode = 'USD';
      const {
        currency: baseCurrency,
        rates: pairs,
      }: { currency: string; rates: Record<string, string> } = await getExchangeRates(currencyCode);
      const timestamp = new Date();

      // five minutes
      const expiresAt = new Date(new Date().getTime() + 5 * 60 * 1000);

      const rates: Array<ProductPriceRate> = Object.entries(pairs).map(([quoteCurrency, rate]) => {
        return {
          baseCurrency,
          quoteCurrency,
          rate: parseFloat(rate),
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
          name: 'UPDATE_COINBASE_RATES_FAILED',
          message: 'Updating ECB Rates failed',
        },
      };
    }
  },
};

WorkerDirector.registerAdapter(UpdateCoinbaseRates);

WorkerDirector.configureAutoscheduling(UpdateCoinbaseRates, {
  schedule: everyMinute,
  retries: 0,
  input: () => {
    /* */
  },
});
