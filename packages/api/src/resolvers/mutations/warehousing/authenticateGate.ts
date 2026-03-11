import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { TicketingModuleNotFoundError } from '../../../errors.ts';

const {
  UNCHAINED_COOKIE_PATH = '/',
  UNCHAINED_COOKIE_DOMAIN,
  UNCHAINED_COOKIE_SAMESITE = 'lax',
  UNCHAINED_COOKIE_INSECURE,
} = process.env;

const GATE_COOKIE_NAME = 'unchained_gate_passcode';
const GATE_COOKIE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

export default async function authenticateGate(
  root: never,
  { passCode }: { passCode: string },
  context: Context,
) {
  const { services, userId } = context;
  log(`mutation authenticateGate`, { userId });

  if (!passCode) return false;

  const ticketingServices = services as unknown as {
    ticketing?: {
      isPassCodeValid: (passCode: string, productId?: string) => Promise<boolean>;
    };
  };

  if (!ticketingServices.ticketing?.isPassCodeValid) {
    throw new TicketingModuleNotFoundError({});
  }

  const isValid = await ticketingServices.ticketing.isPassCodeValid(passCode);
  if (!isValid) return false;

  const secure = !UNCHAINED_COOKIE_INSECURE;
  const sameSite =
    (
      {
        none: 'none',
        lax: 'lax',
        strict: 'strict',
      } as Record<string, 'none' | 'lax' | 'strict'>
    )[UNCHAINED_COOKIE_SAMESITE?.trim()?.toLowerCase()] || 'lax';

  context.setCookie(GATE_COOKIE_NAME, passCode, {
    domain: UNCHAINED_COOKIE_DOMAIN,
    path: UNCHAINED_COOKIE_PATH,
    secure,
    httpOnly: true,
    sameSite,
    maxAge: GATE_COOKIE_MAX_AGE,
  });

  return true;
}
