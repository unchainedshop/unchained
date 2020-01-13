import { createLogger, Logs } from 'meteor/unchained:core-logger';

const logger = createLogger('unchained:api');

// we don't log this query because of reasons ;)
export default function(root, { limit, offset }, { userId }) {
  logger.info(`query logs: ${limit} ${offset} ${userId}`); // eslint-disable-line
  const selector = {};
  const logs = Logs.find(selector, {
    skip: offset,
    limit,
    sort: {
      created: -1
    }
  }).fetch();
  return logs;
}
