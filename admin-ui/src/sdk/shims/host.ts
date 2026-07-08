/**
 * Bridge between native ESM plugin modules and the webpack-bundled host app.
 *
 * The admin-ui app exposes its own module instances on
 * window.__UNCHAINED_PLUGIN_DEPS__ (see modules/plugins/PluginContext.tsx)
 * before any plugin bundle is imported.
 *
 * Returns a Proxy that defers the registry lookup until the first property
 * access. Note the generated shims read properties at module-evaluation time
 * (`export const X = dep.X`), so resolution effectively happens when the
 * plugin bundle is imported — which the PluginProvider guarantees is after
 * setupPluginRuntime() has registered the deps. The Proxy's job is to give a
 * clear error (below) instead of a cryptic undefined when that contract is
 * violated, e.g. a shim module imported outside the admin-ui.
 */
export function hostDep(specifier: string): any {
  let resolved: any = undefined;
  let didResolve = false;

  const resolve = () => {
    if (didResolve) return resolved;
    const deps =
      typeof window !== 'undefined' &&
      (window as any).__UNCHAINED_PLUGIN_DEPS__;
    const dep = deps?.[specifier];
    if (!dep) {
      throw new Error(
        `Unchained admin-ui plugin runtime: host dependency "${specifier}" is not available. ` +
          'Plugin modules can only be loaded by the admin-ui after its plugin runtime is initialized.',
      );
    }
    resolved = dep;
    didResolve = true;
    return dep;
  };

  return new Proxy(Object.create(null), {
    get(_target, prop) {
      if (prop === Symbol.toPrimitive || prop === Symbol.toStringTag) {
        return undefined;
      }
      return resolve()[prop];
    },
    set(_target, prop, value) {
      resolve()[prop] = value;
      return true;
    },
    has(_target, prop) {
      return prop in resolve();
    },
    ownKeys() {
      return Reflect.ownKeys(resolve());
    },
    getOwnPropertyDescriptor(_target, prop) {
      return Object.getOwnPropertyDescriptor(resolve(), prop);
    },
    getPrototypeOf() {
      return Object.getPrototypeOf(resolve());
    },
  });
}
