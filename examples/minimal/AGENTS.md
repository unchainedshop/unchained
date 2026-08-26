# AGENTS.md

Minimal example of an Unchained Engine project: Fastify + `@unchainedshop/platform` + base plugin preset. Use this as the template shape when generating a new Unchained project.

## Run

```bash
npm install
npm start          # boots on http://localhost:3000 (needs MongoDB, see .env.defaults)
```

## Conventions

- Plain ESM JavaScript (`boot.js`); plugins MUST be registered before `startPlatform()`:

```js
import { registerBasePlugins } from '@unchainedshop/plugins/presets/base';
registerBasePlugins();
const platform = await startPlatform({});
```

- The GraphQL API is the primary interface; the Admin UI is enabled via `connect(fastify, platform, { adminUI: true })`.
- Full framework conventions: ../../AGENTS.md. Full docs for LLM context: https://docs.unchained.shop/llms-full.txt
