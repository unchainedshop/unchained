import { createHmac, randomBytes, randomInt } from 'node:crypto';
import { emit } from '@unchainedshop/events';
import { type ModuleInput, type mongodb, generateDbObjectId } from '@unchainedshop/mongodb';
import {
  type LoginCodeChallenge,
  LoginCodeChallengesCollection,
} from '../db/LoginCodeChallengesCollection.ts';
import { UserAccountAction, userSettings } from '../users-settings.ts';

const MINUTE_MS = 60 * 1000;

const normalizeEmail = (email?: string | null) => email?.trim().toLowerCase() || '';

// Keyed with the server secret, so a leaked hash of a short code cannot be brute-forced offline
const hashSecret = (purpose: 'token' | 'code', value: string) => {
  const { UNCHAINED_TOKEN_SECRET } = process.env;
  if (!UNCHAINED_TOKEN_SECRET) {
    throw new Error('UNCHAINED_TOKEN_SECRET is required for login codes', {
      cause: 'LOGIN_CODE_SECRET_MISSING',
    });
  }
  return createHmac('sha256', UNCHAINED_TOKEN_SECRET)
    .update(`login-code:${purpose}:${value}`)
    .digest('hex');
};

export const configureUsersLoginCodeModule = async ({ db }: ModuleInput<Record<string, any>>) => {
  const LoginCodeChallenges = await LoginCodeChallengesCollection(db);

  const voidChallenges = async ({
    userId,
    email,
  }: {
    userId?: string;
    email?: string;
  }): Promise<number> => {
    const owners: mongodb.Filter<LoginCodeChallenge>[] = [];
    if (userId) owners.push({ userId });
    if (email) owners.push({ email: normalizeEmail(email) });
    if (!owners.length) return 0;

    const { modifiedCount } = await LoginCodeChallenges.updateMany(
      { $or: owners, consumed: null, voided: null },
      { $set: { voided: new Date() } },
    );
    return modifiedCount;
  };

  return {
    /**
     * Voids the open challenges of the user and the address, stores the hashes of a new link token
     * and code and emits them with USER_ACCOUNT_ACTION for the mail. Returns null once the address
     * or the user got maxChallengesPerWindow challenges.
     */
    async createChallenge({
      userId,
      email: rawEmail,
    }: {
      userId: string;
      email: string;
    }): Promise<{ challenge: LoginCodeChallenge; token: string; code: string } | null> {
      const { expiresInMinutes, codeLength, maxChallengesPerWindow, challengeWindowMinutes } =
        userSettings.loginCode;
      const email = normalizeEmail(rawEmail);
      const created = new Date();
      const windowStart = new Date(created.getTime() - challengeWindowMinutes * MINUTE_MS);

      const recentChallenges = await LoginCodeChallenges.countDocuments(
        { $or: [{ email }, { userId }], created: { $gt: windowStart } },
        { limit: maxChallengesPerWindow },
      );
      if (recentChallenges >= maxChallengesPerWindow) return null;

      await voidChallenges({ userId, email });

      const token = randomBytes(32).toString('hex');
      const code = String(randomInt(10 ** codeLength)).padStart(codeLength, '0');
      const expires = new Date(created.getTime() + expiresInMinutes * MINUTE_MS);

      const challenge: LoginCodeChallenge = {
        _id: generateDbObjectId(),
        userId,
        email,
        tokenHash: hashSecret('token', token),
        codeHash: hashSecret('code', `${email}:${code}`),
        attempts: 0,
        expires,
        created,
        purgeAt: new Date(
          Math.max(expires.getTime(), created.getTime() + challengeWindowMinutes * MINUTE_MS),
        ),
      };
      await LoginCodeChallenges.insertOne(challenge);

      await emit('USER_ACCOUNT_ACTION', {
        action: UserAccountAction.LOGIN_CODE,
        userId,
        address: email,
        token,
        code,
        expiresInMinutes,
      });

      return { challenge, token, code };
    },

    /**
     * Consumes an open challenge with its link token, or with the address and the code. The same
     * update counts the attempt and consumes the challenge, so parallel guesses cannot exceed
     * maxAttempts.
     */
    async consumeChallenge({
      token,
      email: rawEmail,
      code: rawCode,
    }: {
      token?: string | null;
      email?: string | null;
      code?: string | null;
    }): Promise<LoginCodeChallenge | null> {
      const { maxAttempts } = userSettings.loginCode;
      const now = new Date();
      const open: mongodb.Filter<LoginCodeChallenge> = {
        consumed: null,
        voided: null,
        expires: { $gt: now },
        attempts: { $lt: maxAttempts },
      };

      if (token) {
        return LoginCodeChallenges.findOneAndUpdate(
          { tokenHash: hashSecret('token', token), ...open },
          { $set: { consumed: now } },
          { returnDocument: 'after' },
        );
      }

      const email = normalizeEmail(rawEmail);
      const code = rawCode?.replace(/\s/g, '');
      if (!email || !code) return null;

      const codeHash = hashSecret('code', `${email}:${code}`);
      const challenge = await LoginCodeChallenges.findOneAndUpdate(
        { email, ...open },
        [
          {
            $set: {
              attempts: { $add: ['$attempts', 1] },
              consumed: { $cond: [{ $eq: ['$codeHash', { $literal: codeHash }] }, now, null] },
            },
          },
        ],
        { sort: { created: -1 }, returnDocument: 'after' },
      );
      return challenge?.consumed ? challenge : null;
    },

    voidChallenges,
  };
};

export type UsersLoginCodeModule = Awaited<ReturnType<typeof configureUsersLoginCodeModule>>;
