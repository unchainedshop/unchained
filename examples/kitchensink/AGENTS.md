# AGENTS.md

Kitchensink example: the most complete Unchained Engine setup (all plugin presets, MCP server, Admin UI, seeding). Used as the app under test for the monorepo's integration tests.

## Run

```bash
npm install
npm run dev        # watch mode, boots src/boot.ts on http://localhost:4010 (needs MongoDB)
npm run build      # tsc build to lib/
npm start          # run built lib/boot.js
```

## Conventions

- TypeScript with native Node execution; relative imports MUST include the `.ts` extension (`import seed from './seed.ts'`).
- Plugins are registered explicitly before `startPlatform()` (see `src/boot.ts`, `registerAllPlugins()` from `@unchainedshop/plugins/presets/all`).
- The GraphQL API is the primary interface; an MCP server for AI agents is exposed by `@unchainedshop/api`.
- Full framework conventions: ../../AGENTS.md. Full docs for LLM context: https://docs.unchained.shop/llms-full.txt
