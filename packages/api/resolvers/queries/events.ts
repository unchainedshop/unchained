import { log } from 'meteor/unchained:core-logger';
import { Root, Context } from 'unchained-core-types/api';

export default async function events(
  root: Root,
  { limit, type, offset }: { type: string; limit: number; offset: number },
  { modules, userId }: Context
) {
  log(`query events ${type}`, { userId });

  return modules.events.findEvents({ query: { type }, limit, offset });
}
