import { createLogger } from 'meteor/unchained:logger';
import { Root, Context } from '@unchainedshop/types/api';
import { EventQuery } from '@unchainedshop/types/events';

const logger = createLogger('unchained:api');

export default async function eventsCount(root: Root, params: EventQuery, { modules, userId }: Context) {
  logger.info(
    `query eventsCount  queryString: ${params.queryString}  types: ${params.types}  ${userId}`,
  );

  return modules.events.count(params);
}
