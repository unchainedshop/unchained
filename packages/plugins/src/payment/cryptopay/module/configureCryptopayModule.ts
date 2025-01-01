import { mongodb } from '@unchainedshop/mongodb';
import { CryptopayTransaction, CryptopayTransactionsCollection } from '../db/CryptopayTransactions.js';

export const configureCryptopayModule = ({ db }) => {
  const CryptoTransactions = CryptopayTransactionsCollection(db);

  const getWalletAddress = async (addressId: string): Promise<CryptopayTransaction> => {
    return CryptoTransactions.findOne({ _id: addressId.toLowerCase() });
  };

  const updateMostRecentBlock = async (currency: string, blockHeight: number): Promise<void> => {
    await CryptoTransactions.updateMany(
      {
        currency,
      },
      {
        $set: {
          mostRecentBlockHeight: blockHeight,
        },
      },
    );
  };

  const mapOrderPaymentToWalletAddress = async ({
    addressId,
    contract,
    currency,
    orderPaymentId,
  }: {
    addressId: string;
    contract: string;
    currency: string;
    orderPaymentId: string;
  }): Promise<CryptopayTransaction> => {
    await CryptoTransactions.updateOne(
      {
        _id: addressId.toLowerCase(),
      },
      {
        $setOnInsert: {
          _id: addressId.toLowerCase(),
          contract,
          currency,
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
      { upsert: true },
    );

    return CryptoTransactions.findOne({ _id: addressId.toLowerCase() });
  };

  const getNextDerivationNumber = async (currency: string): Promise<number> => {
    return (await CryptoTransactions.countDocuments({ currency })) + 1;
  };

  const getWalletAddressesByOrderPaymentId = async (
    orderPaymentId: string,
  ): Promise<CryptopayTransaction[]> => {
    return CryptoTransactions.find({
      orderPaymentId,
    }).toArray();
  };

  const updateWalletAddress = async ({
    addressId,
    blockHeight,
    amount,
    contract,
    currency,
    decimals,
  }: {
    addressId: string;
    blockHeight: number;
    amount: string;
    contract: string;
    currency: string;
    decimals: number;
  }): Promise<CryptopayTransaction> => {
    await CryptoTransactions.updateOne(
      {
        _id: addressId.toLowerCase(),
      },
      {
        $setOnInsert: {
          _id: addressId.toLowerCase(),
          currency,
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
      { upsert: true },
    );

    return CryptoTransactions.findOne({ _id: addressId.toLowerCase() });
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

export type CryptopayModule = ReturnType<typeof configureCryptopayModule>;
