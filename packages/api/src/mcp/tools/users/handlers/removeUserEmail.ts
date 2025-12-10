import type { Context } from '../../../../context.ts';
import type { Params } from '../schemas.ts';

export default async function removeUserEmail(context: Context, params: Params<'REMOVE_EMAIL'>) {
  const { modules } = context;
  const { userId, email } = params;

  await modules.users.removeEmail(userId!, email);
  await modules.users.findUserById(userId!);
  return { success: true };
}
