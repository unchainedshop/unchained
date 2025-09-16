# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development server with debugging
npm run dev

# Production build (includes permission generation)
npm run build

# Generate GraphQL types from schema
npm run codegen

# Linting and formatting
npm run lint
npm run format

# Testing
npm run test:e2e          # Open Cypress e2e tests
npm run test:component    # Open Cypress component tests
npm run test:e2e-record   # Run e2e tests in CI with recording

# Internationalization
npm run extract-translation  # Extract translation strings
npm run compile-translation  # Compile translations
```

## Architecture Overview

### Core Technologies
- **Next.js 15** with static export mode (`output: 'export'`)
- **React 19** with TypeScript
- **Apollo Client** for GraphQL data management
- **Tailwind CSS 4** for styling with custom `@apply` classes in `globals.css`
- **React Intl** for internationalization
- **Formik** for form management

### GraphQL Integration
- **Schema Endpoint**: `http://localhost:4010/graphql` (configurable via `NEXT_PUBLIC_GRAPHQL_ENDPOINT`)
- **Code Generation**: Auto-generates TypeScript types from GraphQL schema via `codegen.ts`
- **Type Prefix**: All generated types prefixed with `I` (e.g., `IUser`, `IProduct`)
- **Apollo Cache**: Custom cache policies in `src/modules/apollo/utils/typepolicies.ts`

### Permission System
- **Build-time Generation**: `generate-permissions.js` creates `public/admin-ui-permissions.js`
- **Dynamic Loading**: Permissions loaded via `loadPermissionConfig.js` (external dependency)
- **Role-based Access**: `useAuth` hook provides `hasRole()` function throughout components

### Internationalization Architecture
- **Admin UI Locales**: English (`en`) and German (`de`) in `src/i18n/`
- **Content Locales**: Dynamic from Unchained language configuration
- **Two Locale Systems**: 
  - Bottom-left language toggle: Admin UI localization (hardcoded `en`, `de`)
  - Content locale selectors: Unchained content languages with country dialects (e.g., `fr`, `fr_us`, `fr_de`)

### Module Structure
Each domain module follows consistent patterns:
```
src/modules/{domain}/
├── components/        # React components
├── hooks/            # Custom hooks for data fetching
├── fragments/        # GraphQL fragments
└── utils/           # Domain-specific utilities
```

### Key Architectural Patterns

**Data Fetching**: Custom hooks wrap Apollo Client operations
```typescript
// Pattern: use{Action}{Entity}
const { updateProduct } = useUpdateProduct();
const { products } = useProducts({ limit, offset });
```

**Form Management**: Formik + custom validation with `useForm` hook
```typescript
const form = useForm({
  submit: onSubmit,
  initialValues: {...},
  successMessage: "Saved"
});
```

**Styling System**: Semantic CSS classes in `globals.css` using Tailwind `@apply`
```css
.btn-primary {
  @apply btn-base bg-slate-800 text-white hover:bg-slate-950;
}
```

**Component Composition**: Page → Detail → Form pattern
- Pages handle routing and data fetching
- Detail components handle layout and tabs
- Form components handle specific data sections

### Chat/Copilot Integration
- **AI SDK React**: `@ai-sdk/react` for streaming chat
- **Current State**: Configured for external API at `localhost:4010/chat`
- **Storage**: Local chat history in `localStorage`
- **Components**: Modular chat system in `src/components/chat/`
- **Auto-Introduction**: Automatically sends "Introduce yourself and your tools to the user" when chat is empty
- **Welcome State**: Shows example prompts and capabilities when no messages exist

### Build Configuration
- **Static Export**: No server-side features (API routes disabled)
- **Image Optimization**: Disabled for static export
- **Permission Generation**: Pre-build step generates permission configuration

### Testing Strategy
- **Cypress**: E2E and component testing
- **Test Files**: `.cy.tsx` suffix for component tests
- **Base URL**: `http://localhost:3000` for e2e tests

## Important Notes

- **Static Export Limitation**: `output: 'export'` in `next.config.js` disables API routes
- **Permission Dependency**: Build requires external `loadPermissionConfig.js` file
- **GraphQL Schema**: Development assumes Unchained Commerce backend on `localhost:4010`
- **Locale Architecture**: Two separate locale systems for Admin UI vs content translation
- **TypeScript Configuration**: Relaxed mode (`strict: false`) for compatibility
- **Build Process**: Always runs permission generation before Next.js build

## Environment Variables

```bash
NEXT_PUBLIC_LOGO=url_to_logo
```