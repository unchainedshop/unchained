import {
  PaymentDirector,
  PaymentAdapter,
  PaymentError,
} from 'meteor/unchained:core-payment';
import { createLogger } from 'meteor/unchained:core-logger';
// import { WebApp } from 'meteor/webapp';
// import bodyParser from 'body-parser';
import { OrderPricingSheet } from 'meteor/unchained:core-pricing';
import crypto from 'crypto';

const logger = createLogger('unchained:core-payment:bity-webhook');

const {
  BITY_CLIENT_ID,
  BITY_SIGN_KEY = 'secret',
  BITY_API_ENDPOINT = 'https://exchange.api.bity.com/v2/',
  BITY_WEBHOOK_PATH = '/graphql/bity',
} = process.env;

const signPayload = (parts) => {
  const resultString = parts.filter(Boolean).join('');
  const signKeyInBytes = Buffer.from(BITY_SIGN_KEY, 'hex');

  const signedString = crypto
    .createHmac('sha256', signKeyInBytes)
    .update(resultString)
    .digest('hex');
  return signedString;
};
//
// WebApp.connectHandlers.use(
//   BITY_WEBHOOK_PATH,
//   bodyParser.urlencoded({ extended: false }),
// );
//
// WebApp.connectHandlers.use(BITY_WEBHOOK_PATH, (req, res) => {
//   if (req.method === 'POST') {
//     // const authorizationResponse = req.body || {};
//     try {
//       throw new Error('Not implemented');
//       // const { orderPaymentId } = authorizationResponse;
//       // const orderPayment = OrderPayments.findOne({ _id: orderPaymentId });
//       // const order = orderPayment
//       //   .order()
//       //   .checkout({ paymentContext: authorizationResponse });
//       // res.writeHead(200);
//       // logger.info(
//       //   `Bity Webhook: Unchained confirmed checkout for order ${order.orderNumber}`,
//       //   { orderId: order._id },
//       // );
//       // return res.end(JSON.stringify(order));
//     } catch (e) {
//       // if (
//       //   e.message === 'Payment declined' ||
//       //   e.message === 'Signature mismatch'
//       // ) {
//       //   // We also confirm a declined payment or a signature mismatch with 200 so
//       //   // bity does not retry to send us the failed transaction
//       //   logger.warn(
//       //     `Bity Webhook: Unchained declined checkout with message ${e.message}`,
//       //   );
//       //   res.writeHead(200);
//       //   return res.end();
//       // }
//       logger.warn(`Bity Webhook: Failed with ${e.message}`);
//       res.writeHead(503);
//       return res.end(JSON.stringify(e));
//     }
//   }
//   res.writeHead(404);
//   return res.end();
// });

/*

Flow:

1. Client selects Bity as Payment Provider, uses sign to retrieve a signed Bity Order (payment.sign)

2. Client confirms the price and that she/he made a Bitcoin payment during a 10 min. timeslot (updateOrderPaymentGeneric + checkoutCart)

3. We show a thank you page and an information that the client will receive order confirmation once the funds are secured and bitcoin transaction is confirmed,
tell the user that the order needs to be confirmed during a 24h timeframe, else price is not guaranteed.



A Polling algorithm cycles through all pending unchained orders and tries to find correlating bity orders:

If it find a bity order that is executed, it will do a orderPayment.charge() which will trigger confirmation and delivery instructions.

If it finds a bity order that is CANCELLED or a bity order that has a huge difference between timestamp_created and timestamp_executed,
generate a warning E-Mail to Dimitria (manual solution required)

*/

class Bity extends PaymentAdapter {
  static key = 'shop.unchained.bity';

  static label = 'Bity';

  static version = '1.0';

  static initialConfiguration = [];

  static typeSupported(type) {
    return type === 'GENERIC';
  }

  configurationError() {
    return null;
  }

  isActive() {
    if (this.configurationError() === null) return true;
    return false;
  }

  // eslint-disable-next-line
  isPayLaterAllowed() {
    return false;
  }

  async sign({ transactionContext = {} } = {}) {
    this.log(`Bity -> Sign ${JSON.stringify(transactionContext)}`);
    // Signing the order will estimate a new order in bity, it will also return the orderUUID,
    // the crypto address and the amount based on the cart's total.
    const { orderPayment } = this.context;
    const order = orderPayment.order();
    const pricing = new OrderPricingSheet({
      calculation: order.calculation,
      currency: order.currency,
    });
    const totalAmount = Math.round(pricing?.total().amount / 10 || 0) * 10;

    const payload = await this.bityFetch(``, {
      input: {
        currency: order.currency,
        amount: totalAmount,
      },
      output: {
        currency: 'BTC',
      },
    });

    const signature = signPayload(payload.id, order._id, totalAmount);
    return JSON.stringify({
      payload,
      signature,
    });
  }

  async charge() {
    const { orderPayment } = this.context;
    console.log(orderPayment);
    // Get the Bity Order Information from the OrderPayment object, validate that order information is valid with a hash match.
    // Throw if the order does not exist, is too old regarding timestamp_price_guaranteed vs order submission or there is a hash mismatch.

    // 3. If the bity order is not executed, return false

    // 5. If the bity order is executed, we return true and confirm the order automatically, the Order Confirmation will be sent.

    // if (!payload) {
    //   this.log(
    //     'Bity -> Not trying to charge because of missing payment authorization response, return false to provide later',
    //   );
    //   return false;
    // }
    // this.log('Bity -> Payment declined', payload);
    // throw new Error('Payment declined');

    return false;
  }
}

PaymentDirector.registerAdapter(Bity);
