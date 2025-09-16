import { ReactNode } from 'react';

type RendererFn = (data: unknown) => ReactNode | Promise<ReactNode>;
type ComponentMap = Record<string, RendererFn>;

interface CreateRendererOptions {
  toolsMap: ComponentMap;
  fallbackComponent?: (props: { action: string; data: any }) => ReactNode;
}

export const createRenderer = ({
  toolsMap,
  fallbackComponent,
}: CreateRendererOptions) => {
  const renderer = ({ action, data, ...rest }) => {
    if (!action) return null;

    const Component = toolsMap[action];
    if (!Component) {
      if (fallbackComponent) {
        return fallbackComponent({ action, data });
      }
      return (
        <pre className="p-2 bg-gray-100 rounded text-xs overflow-auto">
          {JSON.stringify({ action, data }, null, 2)}
        </pre>
      );
    }

    return <Component {...data} {...rest} />;
  };
  return renderer;
};

export const createActionMappings = (
  actions: string[],
  component: RendererFn,
): ComponentMap => {
  return Object.fromEntries(actions.map((action) => [action, component]));
};

export const mergeMappings = (...maps: ComponentMap[]): ComponentMap => {
  return Object.assign({}, ...maps);
};
