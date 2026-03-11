import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { TicketingModuleNotFoundError } from '../../../errors.ts';

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

  const passCode = context.getCookie('unchained_gate_passcode');
  if (!passCode) return false;

  const ticketingServices = services as unknown as TicketingServices;
  if (!ticketingServices.ticketing?.isPassCodeValid) {
    throw new TicketingModuleNotFoundError({});
  }

  return ticketingServices.ticketing.isPassCodeValid(passCode, productId);
}
