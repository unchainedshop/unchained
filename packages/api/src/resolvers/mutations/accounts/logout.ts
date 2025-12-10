import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';

export default async function logout(root: never, _: never, context: Context) {
  const { userId } = context;

  log('mutation logout', { userId });

  const success = await context.logout();

  return { success };
}
