import { Context } from '../../../types.js';
import { log } from '@unchainedshop/logger';

export default async function activeWorkTypes(root: never, _: any, { modules, userId }: Context) {
  log(`query activeWorkTypes  `, { userId });

  return modules.worker.activeWorkTypes();
}
