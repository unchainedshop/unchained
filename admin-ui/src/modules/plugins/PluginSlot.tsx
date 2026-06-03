import { Suspense } from 'react';
import { usePlugins } from './PluginContext';
import { PluginRuntimeProvider } from './PluginRuntimeContext';
import PluginErrorBoundary from './PluginErrorBoundary';
import Loading from '@/components/ui/Loading';

interface PluginSlotProps {
  slot: string;
  children?: (
    Component: React.ComponentType<any>,
    config: any,
    manifest: any,
  ) => React.ReactNode;
  [key: string]: any;
}

const PluginSlot = ({ slot, children, ...props }: PluginSlotProps) => {
  const { getSlotPlugins, getComponent, loading } = usePlugins();

  if (loading) return null;

  const slotPlugins = getSlotPlugins(slot);
  if (slotPlugins.length === 0) return null;

  return (
    <>
      {slotPlugins.map(({ manifest, config }) => {
        const componentName = config.component || config.components?.list;
        const Component = getComponent(manifest.name, componentName);

        if (!Component) {
          console.warn(
            `Plugin "${manifest.name}": component "${componentName}" not found in bundle`,
          );
          return null;
        }

        const runtimeCtx = {
          pluginName: manifest.name,
          version: manifest.version,
          slotId: slot,
          config,
        };

        return (
          <PluginErrorBoundary
            key={`${manifest.name}-${componentName}`}
            pluginName={manifest.name}
            componentName={componentName}
          >
            <PluginRuntimeProvider value={runtimeCtx}>
              <Suspense fallback={<Loading />}>
                {children ? (
                  children(Component, config, manifest)
                ) : (
                  <Component {...props} />
                )}
              </Suspense>
            </PluginRuntimeProvider>
          </PluginErrorBoundary>
        );
      })}
    </>
  );
};

export default PluginSlot;
