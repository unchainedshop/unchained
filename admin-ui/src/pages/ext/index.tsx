import { useRouter } from 'next/router';
import { usePlugins } from '../../modules/plugins/PluginContext';
import Loading from '@/components/ui/Loading';

const PluginEntityPage = () => {
  const router = useRouter();
  const { path, entityId } = router.query;
  const { manifests, getComponent, loading } = usePlugins();

  if (loading) return <Loading />;

  if (!path) {
    return (
      <div className="text-center py-16 text-text-muted">
        No plugin path specified.
      </div>
    );
  }

  const pathStr = String(path);
  const isNew = entityId === 'new';

  for (const manifest of manifests) {
    const entity = manifest.slots.entities?.find(
      (e) => e.path.replace(/^\//, '') === pathStr,
    );
    if (entity) {
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

      return <Component entityId={entityId} />;
    }

    const page = manifest.slots.pages?.find(
      (p) => p.path.replace(/^\//, '') === pathStr,
    );
    if (page) {
      const Component = getComponent(manifest.name, page.component);
      if (Component) return <Component />;
    }
  }

  return (
    <div className="text-center py-16 text-text-muted">
      Plugin page &quot;{pathStr}&quot; not found.
    </div>
  );
};

export default PluginEntityPage;
