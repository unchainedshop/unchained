/**
 * Bridge between native ESM plugin modules and the webpack-bundled host app.
 * The admin-ui app exposes its own module instances on
 * window.__UNCHAINED_PLUGIN_DEPS__ (see modules/plugins/PluginContext.tsx)
 * before any plugin bundle is imported.
 */
export function hostDep(specifier: string): any {
  const deps =
    typeof window !== 'undefined' && (window as any).__UNCHAINED_PLUGIN_DEPS__;
  const dep = deps?.[specifier];
  if (!dep) {
    throw new Error(
      `Unchained admin-ui plugin runtime: host dependency "${specifier}" is not available. ` +
        'Plugin modules can only be loaded by the admin-ui after its plugin runtime is initialized.',
    );
  }
  return dep;
}
