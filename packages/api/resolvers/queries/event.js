import { log } from 'meteor/unchained:core-logger';
import { Events } from 'meteor/unchained:core-events';

export default async function event(root, { eventId }, { userId }) {
  log(`query event ${eventId}`, { userId });

  return Events.findEvent({ eventId });
}
