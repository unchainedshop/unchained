import { Db } from '@unchainedshop/types/common';
import { CryptopayTransaction, CryptopayTransactionsCollection } from '../db/CryptopayTransactions';

export interface CryptopayModule {
  findTransaction: (transactionId: string) => Promise<CryptopayTransaction>;
  addTransactionToBlock: (transactionData: {
    transactionId: string;
    block: number;
    amount: number;
    contract: string;
    currency: string;
    decimals: number;
  }) => Promise<CryptopayTransaction>;
}

export const configureCryptopayModule = ({ db }: { db: Db }): CryptopayModule => {
  const CryptoTransactions = CryptopayTransactionsCollection(db);

  return {
    findTransaction: async (transactionId) => {
      return CryptoTransactions.findOne({ _id: transactionId });
    },
    addTransactionToBlock: async ({ transactionId, block, amount, contract, currency, decimals }) => {
      const result = await CryptoTransactions.findOneAndUpdate(
        {
          _id: transactionId,
        },
        {
          $addToSet: {
            blocks: block,
          },
          $setOnInsert: {
            _id: transactionId,
            contract,
            currency,
            amount,
            decimals,
            created: new Date(),
          },
          $set: {
            updated: new Date(),
          },
        },
        { upsert: true },
      );

      return result.value;
    },
  };
};
