import { Db } from '@unchainedshop/types/common';
import { Decimal128 } from 'mongodb';
import { CryptopayTransaction, CryptopayTransactionsCollection } from '../db/CryptopayTransactions';

export interface CryptopayModule {
  getWalletAddress: (addressId: string) => Promise<CryptopayTransaction>;
  getWalletAddressesByOrderPaymentId: (orderPaymentId: string) => Promise<CryptopayTransaction[]>;
  updateMostRecentBlock: (currency: string, blockHeight: number) => Promise<void>;
  updateWalletAddress: (walletData: {
    addressId: string;
    blockHeight: number;
    amount: string;
    contract: string;
    currency: string;
    decimals: number;
  }) => Promise<CryptopayTransaction>;
  mapOrderPaymentToWalletAddress: (walletData: {
    addressId: string;
    contract: string;
    currency: string;
    orderPaymentId: string;
  }) => Promise<CryptopayTransaction>;
}

export const configureCryptopayModule = ({ db }: { db: Db }): CryptopayModule => {
  const CryptoTransactions = CryptopayTransactionsCollection(db);

  const getWalletAddress: CryptopayModule['getWalletAddress'] = async (addressId) => {
    return CryptoTransactions.findOne({ _id: addressId });
  };

  const updateMostRecentBlock: CryptopayModule['updateMostRecentBlock'] = async (
    currency,
    blockHeight,
  ) => {
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

  const mapOrderPaymentToWalletAddress: CryptopayModule['mapOrderPaymentToWalletAddress'] = async ({
    addressId,
    contract,
    currency,
    orderPaymentId,
  }) => {
    await CryptoTransactions.updateOne(
      {
        _id: addressId,
      },
      {
        $setOnInsert: {
          _id: addressId,
          contract,
          currency,
          decimals: null,
          mostRecentBlockHeight: 0,
          blockHeight: 0,
          amount: Decimal128.fromString('0'),
          created: new Date(),
        },
        $set: {
          orderPaymentId,
          updated: new Date(),
        },
      },
      { upsert: true },
    );

    return CryptoTransactions.findOne({ _id: addressId });
  };

  const getWalletAddressesByOrderPaymentId: CryptopayModule['getWalletAddressesByOrderPaymentId'] =
    async (orderPaymentId) => {
      return CryptoTransactions.find({
        orderPaymentId,
      }).toArray();
    };

  const updateWalletAddress: CryptopayModule['updateWalletAddress'] = async ({
    addressId,
    blockHeight,
    amount,
    contract,
    currency,
    decimals,
  }) => {
    await CryptoTransactions.updateOne(
      {
        _id: addressId,
      },
      {
        $setOnInsert: {
          _id: addressId,
          currency,
          contract,
          created: new Date(),
        },
        $set: {
          decimals,
          blockHeight,
          mostRecentBlockHeight: blockHeight,
          amount: Decimal128.fromString(amount),
          updated: new Date(),
        },
      },
      { upsert: true },
    );

    return CryptoTransactions.findOne({ _id: addressId });
  };

  return {
    getWalletAddress,
    updateMostRecentBlock,
    updateWalletAddress,
    mapOrderPaymentToWalletAddress,
    getWalletAddressesByOrderPaymentId,
  };
};
