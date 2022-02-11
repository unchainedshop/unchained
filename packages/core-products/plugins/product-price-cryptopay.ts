import { Context } from '@unchainedshop/types/api';
import { emit, registerEvents } from 'meteor/unchained:events';
import { IProductPricingAdapter } from '@unchainedshop/types/products.pricing';
import bodyParser from 'body-parser';
import { useMiddlewareWithCurrentContext } from 'meteor/unchained:api';
import { ProductPricingDirector, ProductPricingAdapter } from 'meteor/unchained:core-products';

const {
  CRYPTOPAY_SECRET,
  CRYPTOPAY_PRICING_WEBHOOK_PATH = '/graphql/cryptopay-pricing',
} = process.env;

const CRYPTOPAY_PRICING_EVENTS = ['CRYPTOPAY_UPDATE_RATE'];

const CACHE_PERIOD = 60 * 60 * 0.1; // 10 minutes
const MAX_RATE_AGE = CACHE_PERIOD;
const SUPPORTED_CURRENCIES = ['BTC', 'ETH', 'XRP', 'USDT', 'BCH', 'BSV', 'LTC', 'EOS', 'BNB', 'XTZ'];

export type CryptopayRateData = {
  quoteCurrency: string;
  token: string;
  rate: number;
  timestamp: number;
};

useMiddlewareWithCurrentContext(CRYPTOPAY_PRICING_WEBHOOK_PATH, bodyParser.json());

useMiddlewareWithCurrentContext(CRYPTOPAY_PRICING_WEBHOOK_PATH, async (request, response) => {
  registerEvents(CRYPTOPAY_PRICING_EVENTS);
  // Return a 200 response to acknowledge receipt of the event
  const { quoteCurrency, token, rate, timestamp, secret } = request.body;
  if (secret !== CRYPTOPAY_SECRET) {
    response.end(JSON.stringify({ success: false }));
    return;
  }
  emit('CRYPTOPAY_UPDATE_RATE', { quoteCurrency, token, rate, timestamp });
  response.end(JSON.stringify({ success: true }));
});

const ProductPriceCryptopay: IProductPricingAdapter = {
  ...ProductPricingAdapter,

  key: 'shop.unchained.pricing.price-cryptopay',
  version: '1.0',
  label: 'Convert fiat/crypto to crypto with exchange rate from cryptopay (Chainlink)',
  orderIndex: 1,

  isActivatedFor: async (context) => {
    return SUPPORTED_CURRENCIES.indexOf(context.currency.toUpperCase()) !== -1;
  },

  actions: (params) => {
    const pricingAdapter = ProductPricingAdapter.actions(params);
    const { services, modules } = params.context;
    registerEvents(CRYPTOPAY_PRICING_EVENTS);
    return {
      ...pricingAdapter,

      calculate: async () => {
        const { product, country, quantity, currency } = params.context;
        const defaultCurrency = await services.countries.resolveDefaultCurrencyCode(
          {
            isoCode: country,
          },
          params.context,
        );

        const productPrice = await modules.products.prices.price(
          product,
          {
            country,
            currency: defaultCurrency,
            quantity,
          },
          params.context,
        );

        const { calculation = [] } = pricingAdapter.calculationSheet;

        if (
          !productPrice ||
          !productPrice?.amount ||
          calculation?.length ||
          defaultCurrency === currency
        )
          return pricingAdapter.calculate();

        const cryptopayRates = await modules.events.findEvents({
          limit: 10,
          offset: 0,
          type: 'CRYPTOPAY_UPDATE_RATE',
          sort: {
            created: -1,
          },
        });
        const cryptopayRate = cryptopayRates.find((ev) => ev.payload.token === currency)
          ?.payload as CryptopayRateData;
        if (!cryptopayRate || cryptopayRate.timestamp < Date.now() / 1000 - MAX_RATE_AGE) {
          // Allow fallback to different adapter when no data available 
          return pricingAdapter.calculate();
        }
        const { rate } = cryptopayRate;

        const convertedAmount = productPrice?.amount * rate;
        pricingAdapter.resetCalculation();
        pricingAdapter.resultSheet().addItem({
          amount: convertedAmount * quantity,
          isTaxable: productPrice?.isTaxable,
          isNetPrice: productPrice?.isNetPrice,
          meta: { adapter: ProductPriceCryptopay.key },
        });

        return pricingAdapter.calculate();
      },
    };
  },
};

ProductPricingDirector.registerAdapter(ProductPriceCryptopay);
