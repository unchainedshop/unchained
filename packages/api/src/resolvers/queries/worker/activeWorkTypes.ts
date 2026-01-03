import { WorkerDirector } from '@unchainedshop/core';
import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';

export default async function activeWorkTypes(root: never, _: any, { userId }: Context) {
  log(`query activeWorkTypes`, { userId });

  // Return all registered worker plugin types that can process work
  // This allows creating work items for any registered work type
  return WorkerDirector.getActivePluginTypes();
}
