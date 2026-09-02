// Runtime-resolvable definePlugin so the engine and examples can register
// admin-ui plugins on a fresh checkout without building admin-ui first.
// The corresponding types (PluginConfig, slot configs, …) live in plugins.ts
// and are exposed through the package "types" condition. Keep this identity
// helper in sync with the definePlugin declaration in plugins.ts.
export function definePlugin(config) {
  return config;
}

// The browser import map redirects this module to a host shim that supplies
// the real hook. Keeping the export here makes the runtime surface visible to
// shim generation and gives accidental server-side calls a useful failure.
export function usePluginRuntime() {
  throw new Error(
    'usePluginRuntime is only available inside an admin-ui plugin component at runtime',
  );
}
