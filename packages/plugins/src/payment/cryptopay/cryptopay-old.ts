import { Context } from '@unchainedshop/types/api';
import { IPaymentAdapter } from '@unchainedshop/types/payments';
import bodyParser from 'body-parser';
import { useMiddlewareWithCurrentContext } from '@unchainedshop/api';
import { PaymentAdapter, PaymentDirector, PaymentError } from '@unchainedshop/core-payment';
import { OrderPricingSheet } from '@unchainedshop/core-orders';
import { ethers } from 'ethers';
import BIP32Factory from 'bip32';
import * as ecc from 'tiny-secp256k1';
import * as bitcoin from 'bitcoinjs-lib';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:core-payment:cryptopay');

const {
  CRYPTOPAY_SECRET,
  CRYPTOPAY_WEBHOOK_PATH = '/payment/cryptopay',
  CRYPTOPAY_BTC_XPUB,
  CRYPTOPAY_ETH_XPUB,
  CRYPTOPAY_BTC_TESTNET = false,
  CRYPTOPAY_MAX_RATE_AGE = '360', // seconds
  CRYPTOPAY_MAX_CONV_DIFF = '0.01',
} = process.env;

enum CryptopayCurrencies { // eslint-disable-line
  BTC = 'BTC',
  ETH = 'ETH',
}

const MAX_RATE_AGE = parseInt(CRYPTOPAY_MAX_RATE_AGE, 10);
const MAX_ALLOWED_DIFF = parseFloat(CRYPTOPAY_MAX_CONV_DIFF); // Accept payments when the converted amount differs by adapterActions much (in percent)

export default (app) => {
  useMiddlewareWithCurrentContext(app, CRYPTOPAY_WEBHOOK_PATH, bodyParser.json());

  useMiddlewareWithCurrentContext(app, CRYPTOPAY_WEBHOOK_PATH, async (request, response) => {
    // Return a 200 response to acknowledge receipt of the event
    const resolvedContext = request.unchainedContext as Context;
    const { currency, contract, decimals, address, amount, secret } = request.body;
    if (secret !== CRYPTOPAY_SECRET) {
      logger.warn(`Cryptopay Plugin: Invalid Cryptopay Secret provided`);
      response.end(JSON.stringify({ success: false }));
      return;
    }
    const orderPayment = await resolvedContext.modules.orders.payments.findOrderPaymentByContextData({
      context: { cryptoAddresses: { currency, address } },
    });
    if (orderPayment) {
      if (currency === CryptopayCurrencies.ETH && contract && contract !== '') {
        const ERC20CurrencyCount = await resolvedContext.modules.currencies.count({
          includeInactive: false,
          contractAddress: contract,
        });
        if (!ERC20CurrencyCount) {
          logger.warn(`Cryptopay Plugin: ERC20 token address ${contract} not whitelisted.`);
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
        convertedAmount = amount / 10 ** (decimals - 8); // All crypto native prices denoted with 8 decimals
      } else {
        // Need to convert
        const rate = await resolvedContext.modules.products.prices.rates.getRate(
          order.currency,
          contract && contract !== '' ? contract : currency, // Convert to the smart contract if given
          MAX_RATE_AGE,
        );
        if (rate) {
          // We assume that we are converting to a fiat currency here (with 2 decimals).
          // Paying an order with prices in crypto in another crypto is not supported.
          convertedAmount = Math.round((amount / 10 ** decimals) * rate * 100);
        }
      }
      if (convertedAmount && convertedAmount >= totalAmount * (1 - MAX_ALLOWED_DIFF)) {
        await resolvedContext.modules.orders.checkout(
          order._id,
          {
            transactionContext: { address },
            paymentContext: { address },
          },
          resolvedContext,
        );
        response.end(JSON.stringify({ success: true }));
      } else {
        logger.warn(
          `Cryptopay Plugin: OrderPayment ${orderPayment._id} not marked as paid. Converted amount is ${convertedAmount}`,
        );
        response.end(JSON.stringify({ success: false }));
      }
    } else {
      logger.info(
        `Cryptopay Plugin: No orderPayment with address ${address} and currency ${currency} found`,
      );
      response.end(JSON.stringify({ success: false }));
    }
  });
};

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
        if (adapterActions.configurationError() === null) return true;
        return false;
      },

      isPayLaterAllowed() {
        return false;
      },

      sign: async () => {
        const { orderPayment } = params.paymentContext;
        if (orderPayment?.context.length) {
          // Do not derive address a second time for order payment, return existing address
          const existingAddresses = orderPayment.context.filter((c) => c.currency);
          if (existingAddresses) {
            return JSON.stringify(existingAddresses);
          }
        }
        const cryptoAddresses: { currency: CryptopayCurrencies; address: string }[] = [];
        if (CRYPTOPAY_BTC_XPUB) {
          const network = CRYPTOPAY_BTC_TESTNET ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
          const bip32 = BIP32Factory(ecc);
          const hardenedMaster = bip32.fromBase58(CRYPTOPAY_BTC_XPUB, network);
          const btcDerivationNumber = await modules.orders.payments.countOrderPaymentsByContextData({
            context: { cryptoAddresses: { currency: CryptopayCurrencies.BTC } },
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
            context: { cryptoAddresses: { currency: CryptopayCurrencies.ETH } },
          });
          cryptoAddresses.push({
            currency: CryptopayCurrencies.ETH,
            address: hardenedMaster.derivePath(`0/${ethDerivationNumber}`).address,
          });
        }
        await modules.orders.payments.updateContext(
          orderPayment._id,
          { cryptoAddresses },
          params.context,
        );
        return JSON.stringify(cryptoAddresses);
      },

      charge: async (): Promise<false> => {
        return false;
      },
    };

    return adapterActions;
  },
};

PaymentDirector.registerAdapter(Cryptopay);
