import { Context } from '@unchainedshop/types/api';
import { ProductPriceRate } from '@unchainedshop/types/products.pricing';
import bodyParser from 'body-parser';
import { useMiddlewareWithCurrentContext } from '@unchainedshop/api';

const { CRYPTOPAY_SECRET, CRYPTOPAY_PRICING_WEBHOOK_PATH = '/pricing/cryptopay' } = process.env;

export default (app) => {
  useMiddlewareWithCurrentContext(app, CRYPTOPAY_PRICING_WEBHOOK_PATH, bodyParser.json());

  useMiddlewareWithCurrentContext(app, CRYPTOPAY_PRICING_WEBHOOK_PATH, async (request, response) => {
    const resolvedContext = request.unchainedContext as Context;
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
    const success = await resolvedContext.modules.products.prices.rates.updateRate(rateData);
    response.end(JSON.stringify({ success }));
  });
};
