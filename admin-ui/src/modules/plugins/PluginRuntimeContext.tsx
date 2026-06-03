import { createContext, useContext } from 'react';

interface PluginRuntimeContextType {
  pluginName: string;
  version?: string;
  slotId: string;
  config: Record<string, any>;
}

const PluginRuntimeContext = createContext<PluginRuntimeContextType | null>(
  null,
);

export const PluginRuntimeProvider = PluginRuntimeContext.Provider;

export const usePluginRuntime = (): PluginRuntimeContextType => {
  const ctx = useContext(PluginRuntimeContext);
  if (!ctx) {
    throw new Error('usePluginRuntime must be used inside a plugin component rendered by PluginSlot');
  }
  return ctx;
};

export default PluginRuntimeContext;
