import { createLogger } from '@unchainedshop/logger';
import { Context } from '@unchainedshop/api';
import { OrderStatus } from '@unchainedshop/core-orders';
import { CryptopayModule } from './module.js';
import { ProductPriceRate } from '@unchainedshop/core-products';

const { CRYPTOPAY_SECRET, CRYPTOPAY_MAX_RATE_AGE = '360' } = process.env;

const logger = createLogger('unchained:core-payment:cryptopay');

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
    logger.warn(`Cryptopay Plugin: Invalid Cryptopay Secret provided`);
    throw new Error('Secret invalid');
  }

  if (wallet) {
    const { address, blockHeight, amount, contract, decimals, currencyCode } = wallet;
    const { orderPaymentId } = await modules.cryptopay.updateWalletAddress({
      address,
      blockHeight,
      amount,
      contract,
      decimals,
      currencyCode,
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
    await modules.products.prices.rates.updateRates([rateData]);
  }

  if (ping) {
    const { blockHeight, currencyCode } = ping;
    await modules.cryptopay.updateMostRecentBlock(currencyCode, blockHeight);
  }
}
