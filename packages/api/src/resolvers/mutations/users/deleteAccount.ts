import { log } from '@unchainedshop/logger';
import { Context } from '../../../types.js';
import { InvalidIdError, UserNotFoundError } from '../../../errors.js';

const deleteAccount = async (_, { userId }, context: Context) => {
  const { modules, userAgent, userId: currentUserId } = context;
  log(`mutation deleteAccount ${userId} ${userAgent}`, { userId });
  const normalizedUserId = userId || currentUserId;
  if (!normalizedUserId) throw new InvalidIdError({ userId: normalizedUserId });
  if (!(await modules.users.userExists({ userId: normalizedUserId })))
    throw new UserNotFoundError({ userId: normalizedUserId });

  await modules.users.deleteAccount({ userId: normalizedUserId }, context);
  return true;
};

export default deleteAccount;
