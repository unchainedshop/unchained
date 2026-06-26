import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { GATE_COOKIE_NAME, getGateCookieOptions } from '../../../gate-cookie.ts';

export default async function deauthenticateGate(root: never, _: never, context: Context) {
  const { userId } = context;
  log(`mutation deauthenticateGate`, { userId });

  context.clearCookie(GATE_COOKIE_NAME, getGateCookieOptions());

  return true;
}
