import { createLogger, Logs } from 'meteor/unchained:core-logger';

const logger = createLogger('unchained:api');

// we don't log this query because of reasons ;)
export default function logs(root, { limit, offset }, { userId }) {
  logger.info(`query logs: ${limit} ${offset} ${userId}`);

  const selector = {};
  return Logs.find(selector, {
    skip: offset,
    limit,
    sort: {
      created: -1,
    },
  }).fetch();
}
