/**
 * Bridge between native ESM plugin modules and the webpack-bundled host app.
 *
 * The admin-ui app exposes its own module instances on
 * window.__UNCHAINED_PLUGIN_DEPS__ (see modules/plugins/PluginContext.tsx)
 * before any plugin bundle is imported.
 *
 * Returns a Proxy that defers the underlying lookup until the first property
 * access at call time. This makes shim modules resilient to module-evaluation
 * ordering — the shim's top-level `export const X = dep.X` binds X to a
 * proxy getter, and the real dependency is only resolved when plugin code
 * actually reads or calls X.
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
