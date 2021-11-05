import { log } from 'meteor/unchained:core-logger';
import { _ID } from 'unchained-core-types/common';
import { Root, Context } from 'unchained-core-types/api';

export default async function event(
  root: Root,
  { eventId }: { eventId: _ID },
  { modules, userId }: Context
) {
  log(`query event ${eventId}`, { userId });

  return modules.events.findEvent({ eventId });
}
