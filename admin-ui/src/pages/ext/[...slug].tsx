import { useRouter } from 'next/router';
import { usePlugins } from '../../modules/plugins/PluginContext';
import Loading from '@/components/ui/Loading';

const PluginEntityPage = () => {
  const router = useRouter();
  const { slug } = router.query;
  const { manifests, getComponent, loading } = usePlugins();

  if (loading || !slug) return <Loading />;

  const slugParts = Array.isArray(slug) ? slug : [slug];
  const entityId = slugParts[1];
  const isNew = entityId === 'new';

  for (const manifest of manifests) {
    const entity = manifest.slots.entities?.find(
      (e) => e.path.replace(/^\//, '') === slugParts[0],
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
        return <div>Component &quot;{componentName}&quot; not found</div>;

      return <Component entityId={entityId} />;
    }

    const page = manifest.slots.pages?.find(
      (p) => p.path.replace(/^\//, '') === slugParts[0],
    );
    if (page) {
      const Component = getComponent(manifest.name, page.component);
      if (Component) return <Component />;
    }
  }

  router.replace('/404');
  return null;
};

export default PluginEntityPage;
