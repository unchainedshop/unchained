import { log } from '@unchainedshop/logger';
import { Root, Context } from '@unchainedshop/types/api.js';

export default async function event(
  root: Root,
  { eventId }: { eventId: string },
  { modules, userId }: Context,
) {
  log(`query event ${eventId}`, { userId });

  return modules.events.findEvent({ eventId });
}
