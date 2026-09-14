# AGENTS.md

Kitchensink example: a full Unchained Engine setup (all plugin preset, MCP server, Admin UI, seeding). The monorepo's integration tests start their own platform through `tests/setup.js`.

## Run

```bash
npm install
npm --prefix plugins/bookmark-manager install
npm run dev        # builds plugin, then watches backend and plugin on http://localhost:4010
npm run build      # tsc build to lib/
npm start          # run built lib/boot.js
```

## Conventions

- TypeScript with native Node execution; relative imports MUST include the `.ts` extension (`import seed from './seed.ts'`).
- Plugins are registered explicitly before `startPlatform()` (see `src/boot.ts`, `registerAllPlugins()` from `@unchainedshop/plugins/presets/all`).
- The GraphQL API is the primary interface; an MCP server for AI agents is exposed by `@unchainedshop/api`.
- Full framework conventions: ../../AGENTS.md. Full docs for LLM context: https://docs.unchained.shop/llms-full.txt
