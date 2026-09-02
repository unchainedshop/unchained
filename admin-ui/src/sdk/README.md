# Admin UI Plugins

Extend the Unchained admin-ui with your own pages, entity managers, tabs, and
dashboard widgets — without forking it. A plugin is a single ESM bundle plus a
manifest you register on the engine; the admin-ui discovers and loads it at
runtime.

## How it works

- Plugins are built with `definePluginConfig()` from
  `@unchainedshop/admin-ui/plugin-build` into one standard ESM bundle.
- Dependencies the host app already ships (React, Apollo, react-intl, the
  `@unchainedshop/admin-ui/*` SDK modules, ...) are left as bare import
  specifiers. In the browser, an import map resolves them to the host's own
  module instances, so your plugin runs on the exact same React/Apollo as the
  admin-ui. Everything else you import gets bundled in.
- The engine serves your bundle under `/admin-plugins/<name>.js` and a
  manifest under `/admin-ui-plugins.json`; the admin-ui loads bundles with a
  native dynamic `import()`.

The module graph (which specifiers are shared vs. bundled) is defined in
[`plugin-runtime.mjs`](./plugin-runtime.mjs) — see `SHARED_DEP_SHIMS` and
`SDK_ENTRY_KEYS`.

## Writing a plugin

Minimal project layout (see `examples/kitchensink/plugins/bookmark-manager`
for a complete one):

```
my-plugin/
├── package.json
├── tsup.config.ts
└── src/
    └── index.tsx
```

`package.json`:

```json
{
  "name": "my-plugin",
  "type": "module",
  "scripts": { "build": "tsup", "build:watch": "tsup --watch" },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@unchainedshop/admin-ui": "^5.0.0",
    "esbuild": "^0.25.0",
    "react": "^19.0.0",
    "tsup": "^8.0.0"
  }
}
```

`tsup.config.ts`:

```ts
import { definePluginConfig } from '@unchainedshop/admin-ui/plugin-build';

export default definePluginConfig('my-plugin');
```

`src/index.tsx` — export every component your manifest references, as named
exports:

```tsx
export { default as ThingList } from './components/ThingList';
export { default as ThingDetail } from './components/ThingDetail';
export { default as ThingWidget } from './components/ThingWidget';
```

Inside components you can import from the host SDK:

```tsx
import { Button } from '@unchainedshop/admin-ui/ui';
import { useForm } from '@unchainedshop/admin-ui/form';
import { useProducts } from '@unchainedshop/admin-ui/modules/product';
import { usePluginRuntime } from '@unchainedshop/admin-ui/plugins';
import { useQuery } from '@apollo/client/react';
import { FormattedMessage } from 'react-intl';
```

## Registering a plugin on the engine

Pass the manifest in the `adminUI.plugins` option of the Express or Fastify
`connect()`:

```ts
adminUI: {
  plugins: [
    {
      name: 'my-plugin',            // [a-z0-9._-], used in URLs
      version: '1.0.0',             // optional, informational
      bundlePath: resolve(__dirname, '../plugins/my-plugin/dist/index.js'),
      navigation: {                 // optional: groups nav items in a submenu
        label: 'My Plugin',
        icon: 'bookmark',           // heroicon name
        requiredRole: 'viewProducts',
        sortOrder: 75,              // position among sidebar items, see below
      },
      slots: {
        entities: [
          {
            path: '/things',        // page lives at /ext/things
            label: 'Things',
            icon: 'bookmark',
            requiredRole: 'viewProducts',
            sortOrder: 75,
            components: {
              list: 'ThingList',    // must match a named export of the bundle
              detail: 'ThingDetail',
              create: 'ThingCreate' // optional
            },
          },
        ],
        pages: [
          { path: '/reports', label: 'Reports', component: 'ReportsPage' },
        ],
        'dashboard:widgets': [
          { component: 'ThingWidget', width: 'half' }, // full | half | third
        ],
        'product:tabs': [
          { label: 'Things', component: 'ProductThingsTab' },
        ],
      },
    },
  ],
}
```

Slot types: `entities` (list/detail/create pages under `/ext/<path>`),
`pages` (single custom page under `/ext/<path>`), `dashboard:widgets`, and
`<entity>:tabs` for `product`, `assortment`, `filter`, `user`, `order`.

- `requiredRole` — role name checked against the logged-in user; the item is
  hidden without it.
- `sortOrder` — position in the sidebar. Built-in items use 0–130 in steps of
  10 (Orders 30, Products 40, Users 70, System settings 110, ...). Items
  without a `sortOrder` keep their relative order after ordered ones.

At startup the engine validates the manifest against the bundle and logs a
warning if a referenced component is not exported, if two plugins share a
name, or if the bundle was built against a different admin-ui SDK version
than the one running.

## Development workflow

Run the plugin build in watch mode next to the engine:

```bash
cd my-plugin && npm run build:watch
```

In dev mode (`NODE_ENV !== 'production'`) the engine picks up bundle changes
on the next manifest request — reload the admin-ui to get the new bundle. In
production, bundles are read once at startup and served with immutable
caching, keyed by content hash.

## Content-Security-Policy

The engine injects the import map as an inline `<script type="importmap">`
tag. If you serve the admin-ui with a strict CSP, provide a nonce and it will
be added to the tag:

- **Express + helmet**: set `res.locals.cspNonce` in a middleware (as in
  helmet's CSP nonce docs) before the admin-ui router.
- **Fastify + @fastify/helmet**: register with `enableCSPNonces: true`; the
  engine reads `reply.cspNonce.script`.

Without a nonce, `script-src` must allow the inline import map tag.
