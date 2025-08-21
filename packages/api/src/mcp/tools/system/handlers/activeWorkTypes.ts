import { WorkerDirector } from '@unchainedshop/core';
import { Context } from '../../../../context.js';

const activeWorkTypes = async ({ modules }: Context) => {
  const typeList = await modules.worker.activeWorkTypes();
  const pluginTypes = WorkerDirector.getActivePluginTypes();
  const activeTypes = typeList.filter((type) => {
    return pluginTypes.includes(type);
  });
  return { activeTypes };
};

export default activeWorkTypes;
