import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';

const {
  UNCHAINED_COOKIE_PATH = '/',
  UNCHAINED_COOKIE_DOMAIN,
  UNCHAINED_COOKIE_SAMESITE = 'lax',
  UNCHAINED_COOKIE_INSECURE,
} = process.env;

const GATE_COOKIE_NAME = 'unchained_gate_passcode';

export default async function deauthenticateGate(root: never, _: never, context: Context) {
  const { userId } = context;
  log(`mutation deauthenticateGate`, { userId });

  const secure = !UNCHAINED_COOKIE_INSECURE;
  const sameSite =
    (
      {
        none: 'none',
        lax: 'lax',
        strict: 'strict',
      } as Record<string, 'none' | 'lax' | 'strict'>
    )[UNCHAINED_COOKIE_SAMESITE?.trim()?.toLowerCase()] || 'lax';

  context.clearCookie(GATE_COOKIE_NAME, {
    domain: UNCHAINED_COOKIE_DOMAIN,
    path: UNCHAINED_COOKIE_PATH,
    secure,
    httpOnly: true,
    sameSite,
  });

  return true;
}
