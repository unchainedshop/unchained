import { Context } from '@unchainedshop/types/api';
import { IPaymentAdapter } from '@unchainedshop/types/payments';
import bodyParser from 'body-parser';
import { useMiddlewareWithCurrentContext } from 'meteor/unchained:api';
import {
  PaymentAdapter,
  PaymentDirector,
  PaymentError,
  paymentLogger,
} from 'meteor/unchained:core-payment';
import { OrderPricingSheet } from 'meteor/unchained:core-orders';
import { ethers } from 'ethers';
import BIP32Factory from 'bip32';
import * as ecc from 'tiny-secp256k1';
import * as bitcoin from 'bitcoinjs-lib';

const {
  CRYPTOPAY_SECRET,
  CRYPTOPAY_WEBHOOK_PATH = '/graphql/cryptopay',
  CRYPTOPAY_BTC_XPUB,
  CRYPTOPAY_ETH_XPUB,
  CRYPTOPAY_BTC_TESTNET = false,
} = process.env;

enum CryptopayCurrencies {
  BTC = 'BTC',
  ETH = 'ETH',
}

const MAX_RATE_AGE = 60 * 60 * 0.1; // 10 minutes
const MAX_ALLOWED_DIFF = 0.01; // Accept payments when the converted amount differs by this much (in percent)

useMiddlewareWithCurrentContext(CRYPTOPAY_WEBHOOK_PATH, bodyParser.json());

useMiddlewareWithCurrentContext(CRYPTOPAY_WEBHOOK_PATH, async (request, response) => {
  // Return a 200 response to acknowledge receipt of the event
  const resolvedContext = request.unchainedContext as Context;
  const { currency, contract, decimals, address, amount, secret } = request.body;
  if (secret !== CRYPTOPAY_SECRET) {
    paymentLogger.warn(`Cryptopay Plugin: Invalid Cryptopay Secret provided`);
    response.end(JSON.stringify({ success: false }));
    return;
  }
  const orderPayment = await resolvedContext.modules.orders.payments.findOrderPaymentByContextData({
    context: { currency, address },
  });
  if (orderPayment) {
    if (currency === CryptopayCurrencies.ETH && contract && contract !== '') {
      const ERC20Currency = (await resolvedContext.modules.currencies.findCurrencies({})).filter(
        (c) => c.contractAddress === contract,
      );
      if (!ERC20Currency.length) {
        paymentLogger.warn(`Cryptopay Plugin: ERC20 token address ${contract} not whitelisted.`);
        response.end(JSON.stringify({ success: false }));
        return;
      }
    }
    const order = await resolvedContext.modules.orders.findOrder({
      orderId: orderPayment.orderId,
    });
    const pricing = OrderPricingSheet({
      calculation: order.calculation,
      currency: order.currency,
    });
    const totalAmount = pricing?.total({ useNetPrice: false }).amount;
    let convertedAmount: number;
    if (order.currency === currency) {
      convertedAmount = amount / 10 ** decimals;
    } else {
      // Need to convert
      const rate = await resolvedContext.modules.products.prices.rates.getRate(
        order.currency,
        contract && contract !== '' ? contract : currency, // Convert to the smart contract if given
        MAX_RATE_AGE,
      );
      if (rate) {
        convertedAmount = (amount / 10 ** decimals) * rate;
      }
    }
    if (convertedAmount && convertedAmount >= totalAmount * (1 - MAX_ALLOWED_DIFF)) {
      await resolvedContext.modules.orders.payments.markAsPaid(orderPayment, {});
      response.end(JSON.stringify({ success: true }));
    } else {
      paymentLogger.warn(
        `Cryptopay Plugin: OrderPayment ${orderPayment._id} not marked as paid. Converted amount is ${convertedAmount}`,
      );
      response.end(JSON.stringify({ success: false }));
    }
  } else {
    paymentLogger.info(
      `Cryptopay Plugin: No orderPayment with address ${address} and currency ${currency} found`,
    );
    response.end(JSON.stringify({ success: false }));
  }
});

const Cryptopay: IPaymentAdapter = {
  ...PaymentAdapter,

  key: 'shop.unchained.payment.cryptopay',
  label: 'Cryptopay',
  version: '1.0',

  typeSupported(type) {
    return type === 'GENERIC';
  },

  actions: (params) => {
    const { modules } = params.context;

    const adapterActions = {
      ...PaymentAdapter.actions(params),

      // eslint-disable-next-line
      configurationError() {
        // eslint-disable-line
        if (!CRYPTOPAY_SECRET) {
          return PaymentError.INCOMPLETE_CONFIGURATION;
        }
        return null;
      },

      isActive() {
        if (this.configurationError() === null) return true;
        return false;
      },

      isPayLaterAllowed() {
        return false;
      },

      sign: async () => {
        const { orderPayment } = params.paymentContext;
        const cryptoAddresses: { currency: CryptopayCurrencies; address: string }[] = [];

        if (CRYPTOPAY_BTC_XPUB) {
          const network = CRYPTOPAY_BTC_TESTNET ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
          const bip32 = BIP32Factory(ecc);
          const hardenedMaster = bip32.fromBase58(CRYPTOPAY_BTC_XPUB, network);
          const btcDerivationNumber = await modules.orders.payments.countOrderPaymentsByContextData({
            context: { currency: CryptopayCurrencies.BTC },
          });
          const child = hardenedMaster.derivePath(`0/${btcDerivationNumber}`);
          cryptoAddresses.push({
            currency: CryptopayCurrencies.BTC,
            address: bitcoin.payments.p2pkh({
              pubkey: child.publicKey,
              network,
            }).address,
          });
        }
        if (CRYPTOPAY_ETH_XPUB) {
          const hardenedMaster = ethers.utils.HDNode.fromExtendedKey(CRYPTOPAY_ETH_XPUB);
          const ethDerivationNumber = await modules.orders.payments.countOrderPaymentsByContextData({
            context: { currency: CryptopayCurrencies.ETH },
          });
          cryptoAddresses.push({
            currency: CryptopayCurrencies.ETH,
            address: hardenedMaster.derivePath(`0/${ethDerivationNumber}`).address,
          });
        }
        await modules.orders.payments.updateContext(
          orderPayment._id,
          { orderId: orderPayment.orderId, context: cryptoAddresses },
          params.context,
        );
        return JSON.stringify(cryptoAddresses);
      },

      charge: async () => {
        return false;
      },
    };

    return adapterActions;
  },
};

PaymentDirector.registerAdapter(Cryptopay);
