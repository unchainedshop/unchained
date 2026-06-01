# Contributing to the UI Kit

## Rules

1. **New shared primitives go here**, gated by a doc entry + `/styleguide` section.
2. **Module-specific components** stay in `src/modules/<domain>/components/`.
3. **Use `clsx`** (not `classnames`) for conditional class merging.
4. **Variant/size pattern**: follow the Button.tsx pattern (mapped record objects, not conditional class strings).
5. **Dark mode**: Use semantic token classes (`bg-surface`, `text-text-primary`, `border-border-default`, etc.) defined in `globals.css`. Do not add new `bg-X dark:bg-Y` pairs — use existing tokens or propose a new one.
6. **No standalone `types.ts`** for internal types. Place types in the implementation file.
7. **Barrel exports**: update `index.ts` (or `form/index.ts`) when adding a new component.
8. **ESLint guard**: old import paths are blocked by `no-restricted-imports`. Do not bypass.

## Adding a new component

1. Create the component in `src/components/ui/`.
2. Add it to the barrel export in `index.ts`.
3. Add a demo section in `src/pages/styleguide.tsx`.
4. Update this README's component list.

## Deferred work

| Item | Phase | Notes |
|------|-------|-------|
| Modal -> Headless UI Dialog | C | Behavioral rewrite |
| Table -> TanStack Table | C | New dep + virtualization |
| Combobox consolidation | D | 4 consumers need careful API |
| Semantic tokens | B | After primitives are settled |
| `@unchainedshop/client/ui` export | E | After tokens land |
