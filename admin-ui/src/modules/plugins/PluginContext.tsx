import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface PluginManifest {
  name: string;
  bundleUrl: string;
  slots: Record<string, any[]>;
}

interface PluginModule {
  [exportName: string]: React.ComponentType<any>;
}

interface PluginContextType {
  manifests: PluginManifest[];
  getComponent: (
    pluginName: string,
    componentName: string,
  ) => React.ComponentType<any> | null;
  getSlotPlugins: (
    slotId: string,
  ) => Array<{ manifest: PluginManifest; config: any }>;
  loading: boolean;
}

const PluginContext = createContext<PluginContextType>({
  manifests: [],
  getComponent: () => null,
  getSlotPlugins: () => [],
  loading: true,
});

const moduleCache = new Map<string, PluginModule>();

const loadPluginModule = async (
  bundleUrl: string,
): Promise<PluginModule> => {
  if (moduleCache.has(bundleUrl)) return moduleCache.get(bundleUrl)!;
  const module = await import(/* webpackIgnore: true */ bundleUrl);
  moduleCache.set(bundleUrl, module);
  return module;
};

export const PluginProvider = ({ children }: { children: ReactNode }) => {
  const [manifests, setManifests] = useState<PluginManifest[]>([]);
  const [modules, setModules] = useState<Map<string, PluginModule>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/admin-ui-plugins.json');
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const data: PluginManifest[] = await res.json();
        setManifests(data);

        const loaded = new Map<string, PluginModule>();
        await Promise.all(
          data.map(async (manifest) => {
            try {
              const mod = await loadPluginModule(manifest.bundleUrl);
              loaded.set(manifest.name, mod);
            } catch (err) {
              console.error(
                `Failed to load plugin "${manifest.name}":`,
                err,
              );
            }
          }),
        );
        setModules(loaded);
      } catch (err) {
        console.error('Failed to load plugin manifests:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getComponent = (pluginName: string, componentName: string) => {
    const mod = modules.get(pluginName);
    return (mod?.[componentName] as React.ComponentType<any>) || null;
  };

  const getSlotPlugins = (slotId: string) => {
    return manifests.flatMap((manifest) => {
      const slotConfigs = manifest.slots[slotId];
      if (!slotConfigs) return [];
      return slotConfigs.map((config) => ({ manifest, config }));
    });
  };

  return (
    <PluginContext.Provider
      value={{ manifests, getComponent, getSlotPlugins, loading }}
    >
      {children}
    </PluginContext.Provider>
  );
};

export const usePlugins = () => useContext(PluginContext);
export default PluginContext;
