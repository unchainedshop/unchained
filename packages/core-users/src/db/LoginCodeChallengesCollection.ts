import { type mongodb, buildDbIndexes } from '@unchainedshop/mongodb';

export interface LoginCodeChallenge {
  _id: string;
  userId: string;
  email: string;
  tokenHash: string;
  codeHash: string;
  attempts: number;
  expires: Date;
  consumed?: Date | null;
  voided?: Date | null;
  created: Date;
  purgeAt: Date;
}

export const LoginCodeChallengesCollection = async (db: mongodb.Db) => {
  const LoginCodeChallenges = db.collection<LoginCodeChallenge>('accounts_login_code_challenges');

  await buildDbIndexes<LoginCodeChallenge>(LoginCodeChallenges, [
    { index: { tokenHash: 1 } },
    { index: { email: 1, created: -1 } },
    { index: { userId: 1, created: -1 } },
    { index: { purgeAt: 1 }, options: { expireAfterSeconds: 0 } },
  ]);

  return LoginCodeChallenges;
};
