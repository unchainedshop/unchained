import { log } from 'meteor/unchained:core-logger';
import { Events } from 'meteor/unchained:core-events';

export default async function events(
  root,
  { limit, type, offset },
  { userId }
) {
  log(`query events ${type}`, { userId });

  return Events.findEvents({ limit, offset, type });
}
