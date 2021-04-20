import { createLogger, Logs } from 'meteor/unchained:core-logger';

const logger = createLogger('unchained:api');

// we don't log this query because of reasons ;)
export default function logsCount(root, _, { userId }) {
  logger.info(`query logsCount ${userId}`);
  return Logs.count();
}
