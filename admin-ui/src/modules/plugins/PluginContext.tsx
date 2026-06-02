import './pluginGlobals';
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

const getPluginBaseUrl = () => {
  if (typeof window === 'undefined') return '';
  const graphqlEndpoint =
    process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || '/graphql';
  try {
    const url = new URL(graphqlEndpoint);
    return url.origin;
  } catch {
    return '';
  }
};

const loadPluginScript = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
    document.head.appendChild(script);
  });
};

export const PluginProvider = ({ children }: { children: ReactNode }) => {
  const [manifests, setManifests] = useState<PluginManifest[]>([]);
  const [modules, setModules] = useState<Map<string, PluginModule>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const baseUrl = getPluginBaseUrl();
        const res = await fetch(`${baseUrl}/admin-ui-plugins.json`);
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
              await loadPluginScript(`${baseUrl}${manifest.bundleUrl}`);
              const mod = window.__UNCHAINED_PLUGINS__?.[manifest.name];
              if (mod) {
                loaded.set(manifest.name, mod);
              } else {
                console.error(
                  `Plugin "${manifest.name}" loaded but did not register on window.__UNCHAINED_PLUGINS__`,
                );
              }
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
