import type { Context } from '../../../../context.ts';
import { UserNotFoundError } from '../../../../errors.ts';
import type { Params } from '../schemas.ts';

export default async function removeUser(context: Context, params: Params<'REMOVE'>) {
  const { modules, services } = context;
  const { userId, removeUserReviews } = params;

  if (!(await modules.users.userExists({ userId }))) throw new UserNotFoundError({ userId });

  if (removeUserReviews) {
    await modules.products.reviews.deleteByAuthorId(userId);
  }
  await services.users.deleteUser({ userId });
  return { success: true };
}
