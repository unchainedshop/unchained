import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';

export default async function event(
  root: never,
  { eventId }: { eventId: string },
  { modules, userId }: Context,
) {
  log(`query event ${eventId}`, { userId });

  return modules.events.findEvent({ eventId });
}
