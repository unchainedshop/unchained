import { log } from '@unchainedshop/logger';
import { _ID } from '@unchainedshop/types/common';
import { Root, Context } from '@unchainedshop/types/api';

export default async function event(
  root: Root,
  { eventId }: { eventId: _ID },
  { modules, userId }: Context,
) {
  log(`query event ${eventId}`, { userId });

  return modules.events.findEvent({ eventId });
}
