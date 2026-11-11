import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';

export default async function requestLoginCode(
  root: never,
  { email }: { email: string },
  context: Context,
) {
  log('mutation requestLoginCode', { userId: context.userId });
  await context.services.users.requestLoginCode(email);
  return true;
}
