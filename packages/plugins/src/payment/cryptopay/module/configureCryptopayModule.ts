import { Db } from '@unchainedshop/types/common';
import { Decimal128 } from 'mongodb';
import { CryptopayTransaction, CryptopayTransactionsCollection } from '../db/CryptopayTransactions';

export interface CryptopayModule {
  getWalletAddress: (addressId: string) => Promise<CryptopayTransaction>;
  updateWalletAddress: (walletData: {
    addressId: string;
    blockHeight: number;
    amount: string;
    contract: string;
    currency: string;
    decimals: number;
  }) => Promise<CryptopayTransaction>;
}

export const configureCryptopayModule = ({ db }: { db: Db }): CryptopayModule => {
  const CryptoTransactions = CryptopayTransactionsCollection(db);

  const getWalletAddress: CryptopayModule['getWalletAddress'] = async (addressId) => {
    return CryptoTransactions.findOne({ _id: addressId });
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
          contract,
          currency,
          amount: Decimal128.fromString(amount),
          decimals,
          created: new Date(),
        },
        $set: {
          blockHeight,
          updated: new Date(),
        },
      },
      { upsert: true },
    );

    return CryptoTransactions.findOne({ _id: addressId });
  };

  return {
    getWalletAddress,
    updateWalletAddress,
  };
};
