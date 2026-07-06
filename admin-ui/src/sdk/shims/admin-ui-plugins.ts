import { hostDep } from './host';

const pluginsRuntime = hostDep('@unchainedshop/admin-ui/plugins');

export const definePlugin = pluginsRuntime.definePlugin;
export const usePluginRuntime = pluginsRuntime.usePluginRuntime;
