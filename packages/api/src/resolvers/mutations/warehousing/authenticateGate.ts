import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { TicketingModuleNotFoundError } from '../../../errors.ts';
import { GATE_COOKIE_NAME, GATE_COOKIE_MAX_AGE, getGateCookieOptions } from '../../../gate-cookie.ts';

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

  context.setCookie(GATE_COOKIE_NAME, passCode, getGateCookieOptions(GATE_COOKIE_MAX_AGE));

  return true;
}
