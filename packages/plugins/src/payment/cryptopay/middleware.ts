import { useMiddlewareWithCurrentContext } from '@unchainedshop/api';
import bodyParser from 'body-parser';
import { createLogger } from '@unchainedshop/logger';
import { Context } from '@unchainedshop/types/api';

import { UnchainedCore } from '@unchainedshop/types/core';
import { OrderStatus } from '@unchainedshop/core-orders';
import { ProductPriceRate } from '@unchainedshop/types/products.pricing';
import { CryptopayModule } from './module/configureCryptopayModule';

const {
  CRYPTOPAY_WEBHOOK_PATH = '/payment/cryptopay',
  CRYPTOPAY_SECRET,
  CRYPTOPAY_MAX_RATE_AGE,
} = process.env;

const logger = createLogger('unchained:core-payment:cryptopay');

export default (app: any) => {
  useMiddlewareWithCurrentContext(app, CRYPTOPAY_WEBHOOK_PATH, bodyParser.json());
  useMiddlewareWithCurrentContext(app, CRYPTOPAY_WEBHOOK_PATH, async (req, res) => {
    const resolvedContext = req.unchainedContext as Context;
    const modules = resolvedContext.modules as UnchainedCore['modules'] & { cryptopay: CryptopayModule };
    if (req.method === 'POST') {
      try {
        const { secret, price, wallet, ping } = req.body;
        if (secret !== CRYPTOPAY_SECRET) {
          logger.warn(`Cryptopay Plugin: Invalid Cryptopay Secret provided`);
          throw new Error('Secret invalid');
        }

        if (wallet) {
          const { address, blockHeight, amount, contract, decimals, currency } = wallet;
          const { orderPaymentId } = await modules.cryptopay.updateWalletAddress({
            addressId: address,
            blockHeight,
            amount,
            contract,
            decimals,
            currency,
          });
          const orderPayment =
            orderPaymentId &&
            (await modules.orders.payments.findOrderPayment({
              orderPaymentId,
            }));

          if (orderPayment) {
            // Try to process order to next status
            const order = await modules.orders.findOrder({ orderId: orderPayment.orderId });
            if (order.status === null) {
              await modules.orders.checkout(order._id, {}, resolvedContext);
            } else if (order.status === OrderStatus.PENDING) {
              await modules.orders.processOrder(order, {}, resolvedContext);
            } else {
              throw new Error('Already processed');
            }
          }
        }

        if (price) {
          const { baseCurrency, token, rate, timestamp } = price;

          const timestampDate = new Date(timestamp);
          const expiresAt = new Date(new Date().getTime() + parseInt(CRYPTOPAY_MAX_RATE_AGE, 10) * 1000);

          const rateData: ProductPriceRate = {
            baseCurrency,
            quoteCurrency: token,
            rate,
            expiresAt,
            timestamp: timestampDate,
          };
          console.log('update rate', price, rateData);
          await resolvedContext.modules.products.prices.rates.updateRates([rateData]);
        }

        if (ping) {
          const { blockHeight, currency } = ping;
          await modules.cryptopay.updateMostRecentBlock(currency, blockHeight);
        }

        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));
        return;
      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ success: false, error: e.message }));
        return;
      }
    }
    res.writeHead(404);
    res.end(JSON.stringify({ success: false }));
  });
};
