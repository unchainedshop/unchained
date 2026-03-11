import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { TicketingModuleNotFoundError } from '../../../errors.ts';
import { GATE_COOKIE_NAME } from '../../../gate-cookie.ts';

interface TicketingServices {
  ticketing?: {
    isPassCodeValid: (passCode: string, productId?: string) => Promise<boolean>;
  };
}

export default async function isPassCodeValid(
  root: never,
  { productId }: { productId?: string },
  context: Context,
) {
  const { services, userId } = context;
  log(`query isPassCodeValid`, { userId });

  const passCode = context.getCookie(GATE_COOKIE_NAME);
  if (!passCode) return false;

  const ticketingServices = services as unknown as TicketingServices;
  if (!ticketingServices.ticketing?.isPassCodeValid) {
    throw new TicketingModuleNotFoundError({});
  }

  return ticketingServices.ticketing.isPassCodeValid(passCode, productId);
}
