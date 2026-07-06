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
import { usePluginRuntime } from './PluginRuntimeContext';

declare global {
  interface Window {
    __UNCHAINED_PLUGIN_DEPS__: Record<string, any>;
    /** Legacy registry used by pre-ESM (IIFE) plugin bundles. */
    __UNCHAINED_PLUGINS__?: Record<string, Record<string, any>>;
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
};

const ensureImportMap = async (baseUrl: string): Promise<void> => {
  if (
    document.querySelector('script[type="importmap"][data-unchained-admin-ui]')
  )
    return;

  const res = await fetch(`${baseUrl}/admin-ui-importmap.json`, {
    cache: 'no-cache',
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch import map: HTTP ${res.status}`);
  }
  const map = await res.json();
  const base = baseUrl || window.location.origin;
  const imports: Record<string, string> = {};
  for (const [specifier, target] of Object.entries(map?.imports || {})) {
    if (typeof target !== 'string') continue;
    imports[specifier] = new URL(target, base).href;
  }
  if (Object.keys(imports).length === 0) return;

  const script = document.createElement('script');
  script.type = 'importmap';
  script.setAttribute('data-unchained-admin-ui', '');
  script.textContent = JSON.stringify({ imports });
  document.head.appendChild(script);
};

const loadPluginModule = async (
  manifest: PluginManifest,
  baseUrl: string,
): Promise<PluginModule | null> => {
  const url = new URL(
    manifest.bundleUrl,
    baseUrl || window.location.origin,
  ).href;
  const mod = await import(/* webpackIgnore: true */ url);
  if (mod && Object.keys(mod).length > 0) return mod;
  const legacy = window.__UNCHAINED_PLUGINS__?.[manifest.name];
  if (legacy) return legacy;
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

        await ensureImportMap(baseUrl);
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
