import { Context } from '@unchainedshop/types/api';
import { ProductPriceRate } from '@unchainedshop/types/products.pricing';
import bodyParser from 'body-parser';
import { useMiddlewareWithCurrentContext } from 'meteor/unchained:api';

const { CRYPTOPAY_SECRET, CRYPTOPAY_PRICING_WEBHOOK_PATH = '/graphql/cryptopay-pricing' } = process.env;

useMiddlewareWithCurrentContext(CRYPTOPAY_PRICING_WEBHOOK_PATH, bodyParser.json());

useMiddlewareWithCurrentContext(CRYPTOPAY_PRICING_WEBHOOK_PATH, async (request, response) => {
  const resolvedContext = request.unchainedContext as Context;
  // Return a 200 response to acknowledge receipt of the event
  const { baseCurrency, token, rate, timestamp, secret } = request.body;
  if (secret !== CRYPTOPAY_SECRET) {
    response.end(JSON.stringify({ success: false }));
    return;
  }
  const rateData: ProductPriceRate = {
    baseCurrency,
    quoteCurrency: token,
    rate,
    timestamp,
  };
  const priceRates = await resolvedContext.modules.products.prices.rates.getRates();
  priceRates.replaceOne({ baseCurrency, quoteCurrency: token }, rateData, {
    upsert: true,
  });
  response.end(JSON.stringify({ success: true }));
});
