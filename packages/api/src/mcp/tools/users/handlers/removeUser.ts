import { Context } from '../../../../context.js';
import { removeConfidentialServiceHashes } from '@unchainedshop/core-users';
import { Params } from '../schemas.js';

export default async function removeUser(context: Context, params: Params<'REMOVE'>) {
  const { modules } = context;
  const { userId, removeUserReviews } = params;

  if (!userId) {
    throw new Error('userId is required');
  }
  if (removeUserReviews) {
    await modules.products.reviews.deleteMany({ authorId: userId });
  }
  await modules.users.markDeleted(userId);
  const user = await modules.users.findUserById(userId);
  return { success: true };
}
