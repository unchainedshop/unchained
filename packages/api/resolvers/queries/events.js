import { log } from 'meteor/unchained:core-logger';
import { Events } from 'meteor/unchained:core-events';

export default function events(root, { limit, type, offset }, { userId }) {
  log(`query events ${type}`, { userId });

  return Events.find(type ? { type } : {}, {
    skip: offset,
    limit,
    sort: { created: -1 },
  }).fetch();
}
