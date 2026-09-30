/**
 * Plugins import admin-ui components from the SDK, a separate build with its own copies of the
 * admin-ui modules. A context created in both builds would exist twice, and SDK hooks in a
 * plugin would never see the providers of the host app. Contexts with host providers are
 * therefore registered by name on window: the host app evaluates them first, so every later copy
 * (the SDK's) gets the host's instance. Without a window every copy keeps its own.
 */
export default function sharedContext<T>(name: string, context: T): T {
  if (typeof window === 'undefined') return context;
  const registry = ((window as any).__UNCHAINED_SHARED_CONTEXTS__ ??= {});
  return (registry[name] ??= context);
}
