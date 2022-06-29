import { Context, Root } from '@unchainedshop/types/api';
import { log } from '@unchainedshop/logger';

export default async function activeWorkTypes(root: Root, _: any, { modules, userId }: Context) {
  log(`query activeWorkTypes  `, { userId });

  return modules.worker.activeWorkTypes();
}
