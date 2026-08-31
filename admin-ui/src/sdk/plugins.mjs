// Runtime-resolvable definePlugin so the engine and examples can register
// admin-ui plugins on a fresh checkout without building admin-ui first.
// The corresponding types (PluginConfig, slot configs, …) live in plugins.ts
// and are exposed through the package "types" condition. Keep this identity
// helper in sync with the definePlugin declaration in plugins.ts.
export function definePlugin(config) {
  return config;
}
