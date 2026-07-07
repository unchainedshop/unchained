/** Bare specifiers provided by the host app, mapped to their shim file in dist/. */
export declare const SHARED_DEP_SHIMS: Record<string, string>;

/** SDK entry keys built by tsup.config.ts (excluding shim entries). */
export declare const SDK_ENTRY_KEYS: string[];

/** SDK subpath exports resolvable from plugin bundles, mapped to their dist file. */
export declare const SDK_MODULE_FILES: Record<string, string>;

/** All bare specifiers a plugin bundle may leave external. */
export declare const PLUGIN_EXTERNALS: (string | RegExp)[];
