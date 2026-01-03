import { WorkerDirector } from '@unchainedshop/core';

const activeWorkTypes = async () => {
  // Return all registered worker plugin types that can process work
  const activeTypes = WorkerDirector.getActivePluginTypes();
  return { activeTypes };
};

export default activeWorkTypes;
