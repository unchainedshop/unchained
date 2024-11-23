import { log } from '@unchainedshop/logger';
import { InvalidIdError, UserNotFoundError } from '../../../errors.js';
import { Context } from '../../../context.js';

const deleteUser = async (_, { userId }, context: Context) => {
  const { modules, userAgent, userId: currentUserId } = context;
  log(`mutation deleteUser ${userId} ${userAgent}`, { userId });
  const normalizedUserId = userId || currentUserId;
  if (!normalizedUserId) throw new InvalidIdError({ userId: normalizedUserId });
  if (!(await modules.users.userExists({ userId: normalizedUserId })))
    throw new UserNotFoundError({ userId: normalizedUserId });

  await modules.users.deleteUser({ userId: normalizedUserId }, context);
  return true;
};

export default deleteUser;
