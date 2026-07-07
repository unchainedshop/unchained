import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import * as ReactDOM from 'react-dom';
import * as ReactDOMClient from 'react-dom/client';
import * as ApolloClient from '@apollo/client';
import * as ApolloClientReact from '@apollo/client/react';
import * as NextRouter from 'next/router';
import NextLink from 'next/link';
import NextImage from 'next/image';
import NextHead from 'next/head';
import * as ReactIntl from 'react-intl';
import * as ReactToastify from 'react-toastify';
import * as Formik from 'formik';
import { definePlugin } from '../../sdk/plugins';
import { SHARED_DEP_SHIMS } from '../../sdk/plugin-runtime.mjs';
import { usePluginRuntime } from './PluginRuntimeContext';

declare global {
  interface Window {
    __UNCHAINED_PLUGIN_DEPS__: Record<string, any>;
  }
}

interface PluginManifest {
  name: string;
  version?: string;
  bundleUrl: string;
  navigation?: {
    label: string;
    icon?: string;
    requiredRole?: string;
    sortOrder?: number;
  };
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

/**
 * Expose the host app's module instances to plugin bundles. Plugin bundles are
 * standard ESM with shared dependencies left external; the browser import map
 * resolves those bare specifiers to shim modules that re-export the instances
 * registered here, so plugins run on the exact same React/Apollo as the host.
 */
const setupPluginRuntime = () => {
  if (typeof window === 'undefined') return;
  if (window.__UNCHAINED_PLUGIN_DEPS__) return;

  window.__UNCHAINED_PLUGIN_DEPS__ = {
    react: React,
    'react/jsx-runtime': jsxRuntime,
    'react-dom': ReactDOM,
    'react-dom/client': ReactDOMClient,
    '@apollo/client': ApolloClient,
    '@apollo/client/react': ApolloClientReact,
    'next/router': NextRouter,
    'next/link': { default: NextLink },
    'next/image': { default: NextImage },
    'next/head': { default: NextHead },
    'react-intl': ReactIntl,
    'react-toastify': ReactToastify,
    formik: Formik,
    '@unchainedshop/admin-ui/plugins': { definePlugin, usePluginRuntime },
  };

  if (process.env.NODE_ENV !== 'production') {
    const missing = Object.keys(SHARED_DEP_SHIMS).filter(
      (k) => !(k in window.__UNCHAINED_PLUGIN_DEPS__),
    );
    if (missing.length > 0) {
      console.warn(
        `admin-ui plugin runtime: SHARED_DEP_SHIMS has entries not registered in __UNCHAINED_PLUGIN_DEPS__: ${missing.join(', ')}`,
      );
    }
  }
};

const checkImportMap = (): boolean => {
  if (
    document.querySelector('script[type="importmap"][data-unchained-admin-ui]')
  )
    return true;

  console.warn(
    'admin-ui plugin runtime: import map not found in HTML. ' +
      'The server must inject the import map into <head> before any module scripts run. ' +
      'Plugins that depend on shared host dependencies will fail to load.',
  );
  return false;
};

const loadPluginModule = async (
  manifest: PluginManifest,
  baseUrl: string,
): Promise<PluginModule | null> => {
  const url = new URL(manifest.bundleUrl, baseUrl || window.location.origin)
    .href;
  const mod = await import(/* webpackIgnore: true */ url);
  if (mod && Object.keys(mod).length > 0) return mod;
  console.error(
    `Plugin "${manifest.name}" loaded but exports no components. ` +
      'Rebuild it with the current @unchainedshop/admin-ui/plugin-build.',
  );
  return null;
};

export const PluginProvider = ({ children }: { children: ReactNode }) => {
  const [manifests, setManifests] = useState<PluginManifest[]>([]);
  const [modules, setModules] = useState<Map<string, PluginModule>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setupPluginRuntime();
    let cancelled = false;

    (async () => {
      try {
        const baseUrl = getPluginBaseUrl();
        const res = await fetch(`${baseUrl}/admin-ui-plugins.json`, {
          cache: 'no-cache',
        });
        if (!res.ok || cancelled) {
          setLoading(false);
          return;
        }
        const data: PluginManifest[] = await res.json();
        if (cancelled || !Array.isArray(data) || data.length === 0) {
          setLoading(false);
          return;
        }
        setManifests(data);

        if (!checkImportMap()) {
          setLoading(false);
          return;
        }
        if (cancelled) return;

        const loaded = new Map<string, PluginModule>();
        await Promise.all(
          data.map(async (manifest) => {
            try {
              const mod = await loadPluginModule(manifest, baseUrl);
              if (mod) loaded.set(manifest.name, mod);
            } catch (err) {
              console.error(`Failed to load plugin "${manifest.name}":`, err);
            }
          }),
        );
        if (!cancelled) setModules(loaded);
      } catch (err) {
        console.error('Failed to load plugin manifests:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
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
