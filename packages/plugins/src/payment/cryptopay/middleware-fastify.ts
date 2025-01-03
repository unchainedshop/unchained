import { createLogger } from '@unchainedshop/logger';
import { Context } from '@unchainedshop/api';
import { OrderStatus } from '@unchainedshop/core-orders';
import { CryptopayModule } from './module/configureCryptopayModule.js';
import { ProductPriceRate } from '@unchainedshop/core-products';

const { CRYPTOPAY_SECRET, CRYPTOPAY_MAX_RATE_AGE = '360' } = process.env;

const logger = createLogger('unchained:core-payment:cryptopay');

// TODO: Fastify support
export const cryptopayHandler = async (req, res) => {
  const resolvedContext = req.unchainedContext as Context & {
    modules: {
      cryptopay: CryptopayModule;
    };
  };
  const { modules, services } = resolvedContext;

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
          // TODO: Not sure if it's correct to use processOrder here if status is PENDING!
          const order = await modules.orders.findOrder({ orderId: orderPayment.orderId });
          if (order.status === null) {
            await services.orders.checkoutOrder(order._id, {});
          } else if (order.status === OrderStatus.PENDING) {
            await services.orders.processOrder(order, {});
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
        logger.info(`update rate ${JSON.stringify(price)}, ${JSON.stringify(rateData)}`);
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
};
