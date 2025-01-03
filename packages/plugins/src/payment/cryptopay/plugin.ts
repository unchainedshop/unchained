import { ethers } from 'ethers';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import { networks, payments } from 'bitcoinjs-lib';
import { createLogger } from '@unchainedshop/logger';
import {
  IPaymentAdapter,
  PaymentAdapter,
  PaymentDirector,
  PaymentError,
  OrderPricingSheet,
} from '@unchainedshop/core';
import { CryptopayModule } from './module.js';

const logger = createLogger('unchained:core-payment:cryptopay');

const {
  CRYPTOPAY_SECRET,
  CRYPTOPAY_BTC_XPUB,
  CRYPTOPAY_ETH_XPUB,
  CRYPTOPAY_BTC_TESTNET,
  CRYPTOPAY_DERIVATION_START = '0',
} = process.env;

enum CryptopayCurrencies { // eslint-disable-line
  BTC = 'BTC',
  ETH = 'ETH',
}

type CryptopayAddress = {
  currency: CryptopayCurrencies;
  address: string;
  currencyConversionRate?: number;
  currencyConversionExpiryDate?: Date;
};

const getDerivationPath = (currency: CryptopayCurrencies, index: number): string => {
  const address = `${(parseInt(CRYPTOPAY_DERIVATION_START, 10) || 0) + index}`;
  if (currency === CryptopayCurrencies.ETH) {
    const pathComponents = ethers.defaultPath.split('/');
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
  version: '1.0.0',

  typeSupported(type) {
    return type === 'GENERIC';
  },

  actions: (config, context) => {
    const { modules } = context as typeof context & { modules: CryptopayModule };

    const setConversionRates = async (currencyCode: string, existingAddresses: any[]) => {
      const originCurrencyObj = await modules.currencies.findCurrency({ isoCode: currencyCode });
      const updatedAddresses = await Promise.all(
        existingAddresses.map(async (addressData) => {
          const targetCurrencyObj = await modules.currencies.findCurrency({
            isoCode: addressData.currency,
          });
          if (!targetCurrencyObj?.isActive) return null;
          const rateData = await modules.products.prices.rates.getRate(
            originCurrencyObj,
            targetCurrencyObj,
          );
          return {
            ...addressData,
            currencyConversionRate: rateData?.rate,
            currencyConversionExpiryDate: rateData?.expiresAt,
          };
        }),
      );
      return updatedAddresses.filter(Boolean);
    };

    const updateTransactionsWithOrderPaymentId = async (
      orderPaymentId: string,
      cryptoAddresses: CryptopayAddress[],
    ) => {
      return Promise.all(
        cryptoAddresses.map(async ({ address, currency }) =>
          modules.cryptopay.mapOrderPaymentToWalletAddress({
            addressId: address,
            contract: null,
            currency,
            orderPaymentId,
          }),
        ),
      );
    };

    const adapterActions = {
      ...PaymentAdapter.actions(config, context),

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
        if (!context.order) return true;
        // if (
        //   !Object.values(CryptopayCurrencies).includes(
        //     context.order.currency as CryptopayCurrencies,
        //   )
        // )
        //   return false;
        return true;
      },

      isPayLaterAllowed() {
        return false;
      },

      sign: async () => {
        const { orderPayment, order } = context;

        const existingAddresses = await modules.cryptopay.getWalletAddressesByOrderPaymentId(
          orderPayment._id,
        );
        if (existingAddresses.length) {
          // Do not derive addresses a second time for order payment, return existing addresses
          const existingAddressesWithNewExpiration = await setConversionRates(
            order.currency,
            existingAddresses.map(
              ({ _id, currency }) =>
                ({
                  address: _id,
                  currency,
                }) as CryptopayAddress,
            ),
          );
          return JSON.stringify(existingAddressesWithNewExpiration);
        }

        const cryptoAddresses: CryptopayAddress[] = [];
        if (CRYPTOPAY_BTC_XPUB) {
          const network = CRYPTOPAY_BTC_TESTNET ? networks.testnet : networks.bitcoin;
          const bip32 = BIP32Factory(ecc);
          const hardenedMaster = bip32.fromBase58(CRYPTOPAY_BTC_XPUB, network);
          const btcDerivationNumber = await modules.cryptopay.getNextDerivationNumber(
            CryptopayCurrencies.BTC,
          );
          const derivationPath = getDerivationPath(CryptopayCurrencies.BTC, btcDerivationNumber);
          const child = hardenedMaster.derivePath(derivationPath);
          cryptoAddresses.push({
            currency: CryptopayCurrencies.BTC,
            address: payments.p2pkh({
              pubkey: child.publicKey,
              network,
            }).address,
          });
        }
        if (CRYPTOPAY_ETH_XPUB) {
          // we neuter for security reasons, it's still quite complicated for most ethereum clients to show an appropriate
          // xpub, that's why
          const hdWallet = ethers.HDNodeWallet.fromExtendedKey(CRYPTOPAY_ETH_XPUB);
          const hardenedMaster = 'neuter' in hdWallet ? hdWallet.neuter() : hdWallet;

          const ethDerivationNumber = await modules.cryptopay.getNextDerivationNumber(
            CryptopayCurrencies.ETH,
          );
          const derivationPath = getDerivationPath(CryptopayCurrencies.ETH, ethDerivationNumber);
          const cleanedForHD = derivationPath.split('/').slice(-2).join('/');
          cryptoAddresses.push({
            currency: CryptopayCurrencies.ETH,
            address: hardenedMaster.derivePath(cleanedForHD).address,
          });
        }

        const cryptoAddressesWithExpiration = await setConversionRates(order.currency, cryptoAddresses);
        await updateTransactionsWithOrderPaymentId(orderPayment._id, cryptoAddresses);
        return JSON.stringify(cryptoAddressesWithExpiration);
      },

      charge: async () => {
        const { order, orderPayment } = context;

        const foundWalletsWithBalances = await modules.cryptopay.getWalletAddressesByOrderPaymentId(
          orderPayment._id,
        );

        const walletForOrderPayment = foundWalletsWithBalances.find(
          (wallet) => BigInt(wallet.amount.toString()) > 0n,
        );

        const pricing = OrderPricingSheet({
          calculation: order.calculation,
          currency: order.currency,
        });
        const totalAmount = BigInt(pricing?.total({ useNetPrice: false }).amount);

        if (walletForOrderPayment.currency !== order.currency) {
          const baseCurrency = await modules.currencies.findCurrency({
            isoCode: walletForOrderPayment.currency,
          });
          const quoteCurrency = await modules.currencies.findCurrency({ isoCode: order.currency });

          const { /* min, */ max } = await modules.products.prices.rates.getRateRange(
            baseCurrency,
            quoteCurrency,
            order.confirmed || new Date(),
          );

          const convertedAmount =
            BigInt(walletForOrderPayment.amount.toString()) /
            10n ** (BigInt(walletForOrderPayment.decimals) - 9n);

          // Add a Promille 🍻
          // const minAmount = parseFloat(convertedAmount.toString()) * min * 0.999;
          const maxAmount = parseFloat(convertedAmount.toString()) * max * 1.001;

          if (maxAmount && maxAmount >= totalAmount) {
            // Enough sent
            return {
              transactionId: walletForOrderPayment._id,
            };
          }
          logger.info(
            `Cryptopay Plugin: Wallet ${walletForOrderPayment._id} balance too low (yet): ${maxAmount} < ${totalAmount}`,
          );
        }

        if (walletForOrderPayment) {
          // Hack: Downgrade to 8 decimals
          const convertedAmount =
            BigInt(walletForOrderPayment.amount.toString()) /
            10n ** (BigInt(walletForOrderPayment.decimals) - 9n); // All crypto native prices denoted with 8 decimals

          if (convertedAmount && convertedAmount >= totalAmount) {
            return {
              transactionId: walletForOrderPayment._id,
            };
          }
          logger.info(
            `Cryptopay Plugin: Wallet ${walletForOrderPayment._id} balance too low (yet): ${convertedAmount} < ${totalAmount}`,
          );
        }

        logger.info(
          `Cryptopay Plugin: No confirmed payments found for currency ${
            order.currency
          } and addresses ${JSON.stringify(foundWalletsWithBalances)}`,
        );

        /*
        TODO:

        1. Check that generated crypto addresses are unique and no order payments share the same crypto address, only repeat when derivations completely exhausted.
        2. When derivation path get's close to "exhaustedness" (95%), send a special e-mail alert to tell the user should generate a new xpub.
        3. Extend the handler to report the highest seen block number so we can calculate confirmations, 
        4. Order rejection should trigger an e-mail advising the vendor to actively send back funds

        To allow paying in ETH or BTC or Tokens for CHF orders, it should work like this:
        - When signing, we convert with what we have, if we can convert, fine, if we can't we throw an error at the client. The found rate id will be stored together with a signature of the order total + currency + an expiration date in a special collection
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
