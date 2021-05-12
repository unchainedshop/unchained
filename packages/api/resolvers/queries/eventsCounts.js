import { createLogger } from 'meteor/unchained:core-logger';
import { Events } from 'meteor/unchained:core-events';

const logger = createLogger('unchained:api');

export default function eventsCount(root, { type }, { userId }) {
  logger.info(`query eventsCount ${userId}`);
  return Events.count({ type });
}
