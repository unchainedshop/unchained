import { mongodb } from '@unchainedshop/mongodb';
import { CryptopayTransaction, CryptopayTransactionsCollection } from './db/CryptopayTransactions.js';

const configureCryptopayModule = ({ db }) => {
  const CryptoTransactions = CryptopayTransactionsCollection(db);

  const getWalletAddress = async (address: string): Promise<CryptopayTransaction> => {
    return CryptoTransactions.findOne({ _id: address });
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
    contract: string;
    currencyCode: string;
    orderPaymentId: string;
  }): Promise<CryptopayTransaction> => {
    return CryptoTransactions.findOneAndUpdate(
      {
        _id: address,
      },
      {
        $setOnInsert: {
          _id: address,
          contract,
          currencyCode,
          decimals: null,
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
    );
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
    amount: string;
    contract: string;
    currencyCode: string;
    decimals: number;
  }): Promise<CryptopayTransaction> => {
    return CryptoTransactions.findOneAndUpdate(
      {
        _id: address,
      },
      {
        $setOnInsert: {
          _id: address,
          currencyCode,
          contract,
          created: new Date(),
        },
        $set: {
          decimals,
          blockHeight,
          mostRecentBlockHeight: blockHeight,
          amount: mongodb.Decimal128.fromString(amount),
          updated: new Date(),
        },
      },
      { upsert: true, returnDocument: 'after' },
    );
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
