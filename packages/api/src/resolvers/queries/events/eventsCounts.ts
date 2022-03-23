import { createLogger } from 'meteor/unchained:logger';
import { Root, Context } from '@unchainedshop/types/api';

const logger = createLogger('unchained:api');

export default async function eventsCount(
  root: Root,
  { type }: { type: string },
  { modules, userId }: Context,
) {
  logger.info(`query eventsCount ${userId}`);

  return modules.events.count({ type });
}
