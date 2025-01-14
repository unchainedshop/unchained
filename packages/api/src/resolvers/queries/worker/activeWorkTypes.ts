import { WorkerDirector } from '@unchainedshop/core';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

export default async function activeWorkTypes(root: never, _: any, { modules, userId }: Context) {
  log(`query activeWorkTypes`, { userId });

  const typeList = await modules.worker.activeWorkTypes();
  const pluginTypes = WorkerDirector.getActivePluginTypes();
  return typeList.filter((type) => {
    return pluginTypes.includes(type);
  });
}
