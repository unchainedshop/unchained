import { useRouter } from 'next/router';
import { usePlugins } from '../../modules/plugins/PluginContext';
import { PluginRuntimeProvider } from '../../modules/plugins/PluginRuntimeContext';
import PluginErrorBoundary from '../../modules/plugins/PluginErrorBoundary';
import useCurrentUser from '../../modules/accounts/hooks/useCurrentUser';
import { getPluginPageRedirect } from '../../modules/Auth/permissionConfig';
import Loading from '@/components/ui/Loading';

const PluginEntityPage = () => {
  const router = useRouter();
  const { slug } = router.query;
  const { manifests, getComponent, loading } = usePlugins();
  const { currentUser, loading: userLoading } = useCurrentUser();

  if (loading || userLoading) return <Loading />;

  const slugParts = Array.isArray(slug) ? slug : slug ? [slug] : [];

  if (slugParts.length === 0) {
    return (
      <div className="text-center py-16 text-text-muted">
        No plugin path specified.
      </div>
    );
  }

  const pathStr = slugParts[0];
  const entityId = slugParts[1];
  const isNew = entityId === 'new';

  for (const manifest of manifests) {
    const entity = manifest.slots.entities?.find(
      (e) => e.path.replace(/^\//, '') === pathStr,
    );
    if (entity) {
      const redirect = getPluginPageRedirect(currentUser, entity);
      if (redirect) {
        router.replace(redirect);
        return <Loading />;
      }

      let componentName: string;
      if (!entityId) {
        componentName = entity.components.list;
      } else if (isNew && entity.components.create) {
        componentName = entity.components.create;
      } else {
        componentName = entity.components.detail;
      }

      const Component = getComponent(manifest.name, componentName);
      if (!Component)
        return (
          <div className="text-center py-16 text-text-muted">
            Component &quot;{componentName}&quot; not found in plugin &quot;
            {manifest.name}&quot;
          </div>
        );

      return (
        <PluginErrorBoundary
          pluginName={manifest.name}
          componentName={componentName}
        >
          <PluginRuntimeProvider
            value={{
              pluginName: manifest.name,
              version: manifest.version,
              slotId: 'entities',
              config: entity,
            }}
          >
            <Component entityId={entityId} />
          </PluginRuntimeProvider>
        </PluginErrorBoundary>
      );
    }

    const page = manifest.slots.pages?.find(
      (p) => p.path.replace(/^\//, '') === pathStr,
    );
    if (page) {
      const redirect = getPluginPageRedirect(currentUser, page);
      if (redirect) {
        router.replace(redirect);
        return <Loading />;
      }
      const Component = getComponent(manifest.name, page.component);
      if (Component)
        return (
          <PluginErrorBoundary
            pluginName={manifest.name}
            componentName={page.component}
          >
            <PluginRuntimeProvider
              value={{
                pluginName: manifest.name,
                version: manifest.version,
                slotId: 'pages',
                config: page,
              }}
            >
              <Component />
            </PluginRuntimeProvider>
          </PluginErrorBoundary>
        );
    }
  }

  return (
    <div className="text-center py-16 text-text-muted">
      Plugin page &quot;{pathStr}&quot; not found.
    </div>
  );
};

export default PluginEntityPage;
