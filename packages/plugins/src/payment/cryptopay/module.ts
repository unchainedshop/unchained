import { mongodb } from '@unchainedshop/mongodb';
import {
  type CryptopayTransaction,
  CryptopayTransactionsCollection,
} from './db/CryptopayTransactions.js';

const configureCryptopayModule = ({ db }) => {
  const CryptoTransactions = CryptopayTransactionsCollection(db);

  const getWalletAddress = async (
    address: string,
    contract?: string,
  ): Promise<CryptopayTransaction | null> => {
    const addressId = [address, contract].filter(Boolean).join(':');
    return CryptoTransactions.findOne({ _id: addressId });
  };

  const updateMostRecentBlock = async (currencyCode: string, blockHeight: number): Promise<void> => {
    await CryptoTransactions.updateMany(
      {
        currencyCode,
      },
      {
        $set: {
          mostRecentBlockHeight: blockHeight,
        },
      },
    );
  };

  const mapOrderPaymentToWalletAddress = async ({
    address,
    contract,
    currencyCode,
    orderPaymentId,
  }: {
    address: string;
    contract?: string;
    currencyCode: string;
    orderPaymentId: string;
  }): Promise<CryptopayTransaction> => {
    const addressId = [address, contract].filter(Boolean).join(':');

    return (await CryptoTransactions.findOneAndUpdate(
      {
        _id: addressId,
      },
      {
        $setOnInsert: {
          _id: addressId,
          currencyCode,
          mostRecentBlockHeight: 0,
          blockHeight: 0,
          amount: mongodb.Decimal128.fromString('0'),
          created: new Date(),
        },
        $set: {
          orderPaymentId,
          updated: new Date(),
        },
      },
      { upsert: true, returnDocument: 'after' },
    )) as CryptopayTransaction;
  };

  const getNextDerivationNumber = async (currencyCode: string): Promise<number> => {
    return (await CryptoTransactions.countDocuments({ currencyCode })) + 1;
  };

  const getWalletAddressesByOrderPaymentId = async (
    orderPaymentId: string,
  ): Promise<CryptopayTransaction[]> => {
    return CryptoTransactions.find(
      {
        orderPaymentId,
      },
      {
        sort: {
          created: 1, // Sort by creation date, most recent first
        },
      },
    ).toArray();
  };

  const updateWalletAddress = async ({
    address,
    blockHeight,
    amount,
    contract,
    currencyCode,
    decimals,
  }: {
    address: string;
    blockHeight: number;
    amount: string | number;
    contract?: string;
    currencyCode: string;
    decimals: number;
  }): Promise<CryptopayTransaction> => {
    const addressId = [address, contract].filter(Boolean).join(':');
    return (await CryptoTransactions.findOneAndUpdate(
      {
        _id: addressId,
      },
      {
        $setOnInsert: {
          _id: addressId,
          created: new Date(),
        },
        $set: {
          currencyCode,
          decimals,
          blockHeight,
          mostRecentBlockHeight: blockHeight,
          amount: mongodb.Decimal128.fromString(typeof amount === 'number' ? `${amount}` : amount),
          updated: new Date(),
        },
      },
      { upsert: true, returnDocument: 'after' },
    )) as CryptopayTransaction;
  };

  return {
    getWalletAddress,
    updateMostRecentBlock,
    updateWalletAddress,
    mapOrderPaymentToWalletAddress,
    getNextDerivationNumber,
    getWalletAddressesByOrderPaymentId,
  };
};

export default {
  cryptopay: {
    configure: configureCryptopayModule,
  },
};

export interface CryptopayModule {
  cryptopay: ReturnType<typeof configureCryptopayModule>;
}
