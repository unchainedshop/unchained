import { createLogger } from '@unchainedshop/logger';
import { type Context } from '@unchainedshop/api';
import { OrderStatus } from '@unchainedshop/core-orders';
import { type CryptopayModule } from './module.ts';

const { CRYPTOPAY_SECRET, CRYPTOPAY_MAX_RATE_AGE = '360' } = process.env;

const logger = createLogger('unchained:cryptopay:handler');

export default async function handleWebhook(
  {
    secret,
    wallet,
    price,
    ping,
  }: {
    secret: string;
    wallet?: {
      address: string;
      blockHeight: number;
      amount: string;
      contract?: string;
      decimals?: number;
      currencyCode: string;
    };
    price?: {
      baseCurrency: string;
      token: string;
      rate: number;
      timestamp: string; // ISO date string
    };
    ping?: {
      blockHeight: number;
      currencyCode: string;
    };
  },
  context: Context & {
    modules: CryptopayModule;
  },
) {
  const { modules, services } = context;

  if (secret !== CRYPTOPAY_SECRET) {
    logger.warn(`webhook called with invalid secret`);
    throw new Error('Secret invalid');
  }

  if (wallet) {
    const { address, blockHeight, amount, contract, decimals, currencyCode } = wallet;
    logger.debug('webhook received wallet data', wallet);
    const { orderPaymentId } = await modules.cryptopay.updateWalletAddress({
      address,
      blockHeight,
      amount,
      contract,
      decimals: decimals ?? 0,
      currencyCode,
    });

    const orderPayment =
      orderPaymentId &&
      (await modules.orders.payments.findOrderPayment({
        orderPaymentId,
      }));

    if (orderPayment) {
      const order = await modules.orders.findOrder({ orderId: orderPayment.orderId });
      if (!order) {
        logger.error('Order not found for payment', { orderPaymentId, orderId: orderPayment.orderId });
        throw new Error('Order not found');
      }

      // Process order based on current status:
      // - null status: Initial checkout (new order)
      // - PENDING: Payment received, try to advance to CONFIRMED
      // - Other statuses: Already processed, reject duplicate webhook
      if (order.status === null) {
        logger.info('Initiating checkout for new order', { orderId: order._id });
        await services.orders.checkoutOrder(order._id, {});
      } else if (order.status === OrderStatus.PENDING) {
        // PENDING orders can advance to CONFIRMED when payment is received
        // processOrder will check if auto-confirmation conditions are met
        logger.info('Processing pending order after payment update', { orderId: order._id });
        await services.orders.processOrder(order, {});
      } else {
        logger.warn('Order already processed, ignoring webhook', {
          orderId: order._id,
          status: order.status,
        });
        throw new Error('Already processed');
      }
    }
  }

  if (price) {
    logger.debug('webhook received price data', price);
    const { baseCurrency, token, rate, timestamp } = price;

    const timestampDate = new Date(timestamp);
    const expiresAt = new Date(new Date().getTime() + parseInt(CRYPTOPAY_MAX_RATE_AGE, 10) * 1000);

    const rateData = {
      baseCurrency,
      quoteCurrency: token,
      rate,
      expiresAt,
      timestamp: timestampDate,
    };
    await modules.products.prices.rates.updateRates([rateData]);
  }

  if (ping) {
    logger.debug('webhook received ping data', ping);
    const { blockHeight, currencyCode } = ping;
    await modules.cryptopay.updateMostRecentBlock(currencyCode, blockHeight);
  }
}
