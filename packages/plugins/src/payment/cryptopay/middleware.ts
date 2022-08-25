import { useMiddlewareWithCurrentContext } from '@unchainedshop/api';
import bodyParser from 'body-parser';
import { createLogger } from '@unchainedshop/logger';
import { Context } from '@unchainedshop/types/api';

import { UnchainedCore } from '@unchainedshop/types/core';
import { OrderStatus } from '@unchainedshop/core-orders';
import { CryptopayModule } from './module/configureCryptopayModule';

const { CRYPTOPAY_WEBHOOK_PATH = '/payment/cryptopay', CRYPTOPAY_SECRET } = process.env;

const logger = createLogger('unchained:core-payment:cryptopay');

export default (app: any) => {
  useMiddlewareWithCurrentContext(app, CRYPTOPAY_WEBHOOK_PATH, bodyParser.json());

  useMiddlewareWithCurrentContext(app, CRYPTOPAY_WEBHOOK_PATH, async (req, res) => {
    const resolvedContext = req.unchainedContext as Context;
    const modules = resolvedContext.modules as UnchainedCore['modules'] & { cryptopay: CryptopayModule };
    if (req.method === 'POST') {
      try {
        const { currency, contract, decimals, address, amount, secret, blockHeight } = req.body;
        if (secret !== CRYPTOPAY_SECRET) {
          logger.warn(`Cryptopay Plugin: Invalid Cryptopay Secret provided`);
          throw new Error('Secret invalid');
        }
        await modules.cryptopay.updateWalletAddress({
          addressId: address,
          blockHeight,
          amount,
          contract,
          decimals,
          currency,
        });
        const orderPayment = await modules.orders.payments.findOrderPaymentByContextData({
          context: { cryptoAddresses: { currency, address } },
        });
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
