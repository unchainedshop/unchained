import type { Context } from '../../../../context.ts';
import type { Params } from '../schemas.ts';

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
  await modules.users.findUserById(userId);
  return { success: true };
}
