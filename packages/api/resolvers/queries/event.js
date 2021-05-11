import { log } from 'meteor/unchained:core-logger';
import { Events } from 'meteor/unchained:core-events';

export default function event(root, { eventId }, { userId }) {
  log(`query event ${eventId}`, { userId });

  return Events.findOne({ _id: eventId });
}
