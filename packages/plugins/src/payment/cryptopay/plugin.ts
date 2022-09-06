import { IPaymentAdapter } from '@unchainedshop/types/payments';
import { PaymentAdapter, PaymentDirector, PaymentError } from '@unchainedshop/core-payment';
import { ethers } from 'ethers';
import BIP32Factory from 'bip32';
import * as ecc from 'tiny-secp256k1';
import * as bitcoin from 'bitcoinjs-lib';
import { createLogger } from '@unchainedshop/logger';
import { UnchainedCore } from '@unchainedshop/types/core';
import { OrderPricingSheet } from '@unchainedshop/core-orders';
import { CryptopayModule } from './module/configureCryptopayModule';

const logger = createLogger('unchained:core-payment:cryptopay');

const {
  CRYPTOPAY_SECRET,
  CRYPTOPAY_BTC_XPUB,
  CRYPTOPAY_ETH_XPUB,
  CRYPTOPAY_BTC_TESTNET = false,
  CRYPTOPAY_DERIVATION_START = '0',
} = process.env;

enum CryptopayCurrencies { // eslint-disable-line
  BTC = 'BTC',
  ETH = 'ETH',
}

type CryptopayAddress = {
  currency: CryptopayCurrencies;
  address: string;
  currencyConversionRate: number;
  derivationPath: string;
};

const getDerivationPath = (currency: CryptopayCurrencies, index: number): string => {
  const address = `${(parseInt(CRYPTOPAY_DERIVATION_START, 10) || 0) + index}`;
  if (currency === CryptopayCurrencies.ETH) {
    const pathComponents = ethers.utils.defaultPath.split('/');
    pathComponents[pathComponents.length - 1] = address;
    return pathComponents.join('/');
  }
  if (currency === CryptopayCurrencies.BTC) {
    return `m/44'/0'/0'/0/${address}`;
  }
  return `0/${address}`;
};

const Cryptopay: IPaymentAdapter = {
  ...PaymentAdapter,

  key: 'shop.unchained.payment.cryptopay',
  label: 'Cryptopay',
  version: '1.1',

  typeSupported(type) {
    return type === 'GENERIC';
  },

  actions: (params) => {
    const modules = params.context.modules as UnchainedCore['modules'] & { cryptopay: CryptopayModule };

    const adapterActions = {
      ...PaymentAdapter.actions(params),

      // eslint-disable-next-line
      configurationError() {
        // eslint-disable-line
        if (!CRYPTOPAY_SECRET) {
          return PaymentError.INCOMPLETE_CONFIGURATION;
        }
        if (!CRYPTOPAY_BTC_XPUB && !CRYPTOPAY_ETH_XPUB) {
          return PaymentError.INCOMPLETE_CONFIGURATION;
        }
        return null;
      },

      isActive() {
        // Only support orders that have prices in BTC or ETH for the moment
        if (adapterActions.configurationError() !== null) return false;
        if (!params.paymentContext.order) return true;
        if (
          !Object.values(CryptopayCurrencies).includes(
            params.paymentContext.order.currency as CryptopayCurrencies,
          )
        )
          return false;
        return true;
      },

      isPayLaterAllowed() {
        return false;
      },

      sign: async () => {
        const { orderPayment } = params.paymentContext;
        if (orderPayment?.context?.cryptoAddresses) {
          // Do not derive address a second time for order payment, return existing address
          const existingAddresses = orderPayment.context.cryptoAddresses;
          if (existingAddresses) {
            return JSON.stringify(existingAddresses);
          }
        }
        const cryptoAddresses: CryptopayAddress[] = [];
        if (CRYPTOPAY_BTC_XPUB) {
          const network = CRYPTOPAY_BTC_TESTNET ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
          const bip32 = BIP32Factory(ecc);
          const hardenedMaster = bip32.fromBase58(CRYPTOPAY_BTC_XPUB, network);
          const btcDerivationNumber = await modules.orders.payments.countOrderPaymentsByContextData({
            context: { 'cryptoAddresses.currency': CryptopayCurrencies.BTC },
          });
          const derivationPath = getDerivationPath(CryptopayCurrencies.BTC, btcDerivationNumber);
          const child = hardenedMaster.derivePath(derivationPath);
          cryptoAddresses.push({
            currency: CryptopayCurrencies.BTC,
            derivationPath,
            currencyConversionRate: 1,
            address: bitcoin.payments.p2pkh({
              pubkey: child.publicKey,
              network,
            }).address,
          });
        }
        if (CRYPTOPAY_ETH_XPUB) {
          // we neuter for security reasons, it's still quite complicated for most ethereum clients to show an appropriate
          // xpub, that's why
          const hardenedMaster = ethers.utils.HDNode.fromExtendedKey(CRYPTOPAY_ETH_XPUB).neuter();
          const ethDerivationNumber = await modules.orders.payments.countOrderPaymentsByContextData({
            context: { 'cryptoAddresses.currency': CryptopayCurrencies.ETH },
          });
          const derivationPath = getDerivationPath(CryptopayCurrencies.ETH, ethDerivationNumber);
          const cleanedForHD = derivationPath.split('/').slice(-2).join('/');
          cryptoAddresses.push({
            currency: CryptopayCurrencies.ETH,
            derivationPath,
            currencyConversionRate: 1,
            address: hardenedMaster.derivePath(cleanedForHD).address,
          });
        }
        await modules.orders.payments.updateContext(
          orderPayment._id,
          { ...orderPayment.context, cryptoAddresses },
          params.context,
        );

        return JSON.stringify(cryptoAddresses);
      },

      charge: async () => {
        const addresses: CryptopayAddress[] =
          params.paymentContext.orderPayment.context.cryptoAddresses || [];
        const { order } = params.paymentContext;
        const foundWalletsWithBalances = (
          await Promise.all(
            addresses.map(async ({ address, currency, currencyConversionRate }) => {
              const walletAddress = await modules.cryptopay.getWalletAddress(address);
              if (walletAddress) {
                if (walletAddress.currency === currency) {
                  return walletAddress;
                }
                return {
                  ...walletAddress,
                  amount: BigInt(walletAddress.amount) * BigInt(currencyConversionRate),
                  currency,
                };
              }
              return null;
            }),
          )
        ).filter(Boolean);

        const walletForOrderCurrency = foundWalletsWithBalances.find(
          (wallet) => wallet.currency === order.currency,
        );

        if (walletForOrderCurrency) {
          const pricing = OrderPricingSheet({
            calculation: order.calculation,
            currency: order.currency,
          });
          const totalAmount = BigInt(pricing?.total({ useNetPrice: false }).amount);

          // Hack: Downgrade to 8 decimals
          const convertedAmount =
            BigInt(walletForOrderCurrency.amount) /
            10n ** (BigInt(walletForOrderCurrency.decimals) - 9n); // All crypto native prices denoted with 8 decimals

          if (convertedAmount && convertedAmount >= totalAmount) {
            return {
              transactionId: walletForOrderCurrency._id,
            };
          }
          logger.info(
            `Cryptopay Plugin: Wallet ${walletForOrderCurrency._id} balance too low (yet): ${convertedAmount} < ${totalAmount}`,
          );
        }

        logger.info(
          `Cryptopay Plugin: No confirmed payments found for currency ${
            order.currency
          } and addresses ${JSON.stringify(addresses)}`,
        );

        /*
        TODO:

        1. Check that generated crypto addresses are unique and no order payments share the same crypto address, only repeat when derivations completely exhausted.
        2. When derivation path get's close to "exhaustedness" (95%), send a special e-mail alert to tell the user should generate a new xpub.
        3. Do not allow signing a paid order payment
        4. Extend the middleware to report the highest seen block number so we can calculate confirmations, 
        5. When an order get's confirmed (after succesful payment after rejectability), add the order amount to a special field in the wallet collection so we can find differences
        6. Order rejection should trigger an e-mail advising the vendor to actively send back funds


        To allow paying in ETH or BTC or Tokens for CHF orders, it should work like this:
        - When signing, we convert with what we have, if we can convert, fine, if we can't we throw an error at the client. The converted amount will be stored together with a signature of the order total + currency + an expiration date in a special collection
        - We also return that signed payload to the client so the client can show something like Total: CHF 50.- "Pay 0.0024 BTC in the next 30 minutes" 
        - When a payment occured, the charge function of the plugin picks up. If it can find a valid signed converted amount in the special collection, it will use that information instead of the order total to compare against.
        - When a payment occured to late, the order payment will not be marked as paid and a report will be sent to the vendor that with information about how much to send back.

        Refunds have to be 2nd priority:
        For every case where we should "send back" money to someone, it get's difficult because we don't own the private key. On ETH, we could use permit/approve with web3 to get the permission to send those funds back. On BTC, we could use lightning invoices for the refunds but that will be fuckin compley anyway.

        */

        return false;
      },
    };

    return adapterActions;
  },
};

PaymentDirector.registerAdapter(Cryptopay);

export default Cryptopay;