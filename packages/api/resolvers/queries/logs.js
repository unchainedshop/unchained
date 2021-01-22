// we don't log this query because of reasons ;)
export default function logs(
  root,
  { limit, offset },
  { userId, modules, services }
) {
  const logger = services.createLogger('unchained:api');
  logger.info(`query logs: ${limit} ${offset} ${userId}`);
  return modules.logger.findLogs({ limit, offset });
}
