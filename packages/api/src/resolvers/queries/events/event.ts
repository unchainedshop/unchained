import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';

export default async function event(
  root: never,
  { eventId }: { eventId: string },
  { modules, userId }: Context,
) {
  log(`query event ${eventId}`, { userId });

  return modules.events.findEvent({ eventId });
}
