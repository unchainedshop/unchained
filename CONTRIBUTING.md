# Contributing to Unchained Engine

Thank you for your interest in contributing to Unchained Engine! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Code Style](#code-style)
- [Architecture Overview](#architecture-overview)
- [Good First Issues](#good-first-issues)
- [Getting Help](#getting-help)

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md). We are committed to providing a welcoming and inclusive environment.

## Getting Started

### Prerequisites

- **Node.js 22+** (see [.nvmrc](.nvmrc))
- **MongoDB** (or use MongoDB Memory Server for development)
- **Git**

### First-Time Contributors

1. **Sign the CLA**: Your first PR will require signing our Contributor License Agreement
2. **Look for issues**: Check issues labeled [`good first issue`](https://github.com/unchainedshop/unchained/labels/good%20first%20issue) or [`help wanted`](https://github.com/unchainedshop/unchained/labels/help%20wanted)
3. **Ask questions**: Use [GitHub Discussions](https://github.com/unchainedshop/unchained/discussions) if you need guidance

## Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/unchained.git
cd unchained
```

### 2. Install Dependencies

```bash
npm install
```

This uses npm workspaces to install dependencies for all packages.

### 3. Start Development

```bash
npm run dev
```

This starts:
- Kitchensink example (full-featured demo)
- Admin UI (Next.js dashboard)
- TypeScript watch mode for all packages

### 4. Access the Application

- **GraphQL Playground**: http://localhost:4000/graphql
- **Admin UI**: http://localhost:3000
- **Credentials**: admin@unchained.local / password

## Making Changes

### Branch Naming

Use descriptive branch names:
- `feature/add-new-payment-adapter`
- `fix/order-calculation-bug`
- `docs/update-api-reference`

### Commit Messages

Follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
```
feat(payment): add Apple Pay adapter
fix(orders): correct discount calculation for bundles
docs(api): add GraphQL mutation examples
```

### Working with Packages

Each package in `packages/` can be worked on independently:

```bash
cd packages/core-products
npm run build    # Build this package
npm run test     # Run package tests
```

## Testing

### Run All Tests

```bash
npm test                         # All tests (unit + integration)
npm run test:run:unit           # Unit tests only
npm run test:run:integration    # Integration tests only
```

### Run Specific Tests

```bash
node --test packages/core/src/utils/schedule.test.ts
```

### Writing Tests

- **Unit tests**: Place alongside source files (`*.test.ts`)
- **Integration tests**: Add to `tests/` directory
- Use Node.js native `node:test` module
- Follow existing test patterns in the codebase

### Test Requirements for PRs

- [ ] All existing tests must pass
- [ ] New features require unit tests
- [ ] Bug fixes should include regression tests
- [ ] Integration tests for API changes

## Submitting a Pull Request

### Before Submitting

1. **Run linting**: `npm run lint`
2. **Run tests**: `npm test`
3. **Build packages**: `npm run build`
4. **Update documentation** if needed

### PR Process

1. Create a PR against the `master` branch
2. Fill out the PR template completely
3. Wait for CI checks to pass
4. Address reviewer feedback
5. Once approved, a maintainer will merge

### What We Look For

- Clean, readable code
- Tests for new functionality
- Documentation updates where needed
- No breaking changes without discussion
- Adherence to architecture guidelines

## Code Style

We use ESLint and Prettier for consistent code formatting.

### Auto-Format

```bash
npm run lint    # Lint and fix issues
```

### Style Guidelines

- Use TypeScript for all new code
- Prefer functional patterns over classes
- Keep functions small and focused
- Use meaningful variable names
- Add comments only for non-obvious logic

### TypeScript

- Enable strict mode in new packages
- Export types from package entry points
- Use type inference where possible
- Avoid `any` - use `unknown` if needed

## Architecture Overview

Unchained uses a layered monorepo architecture:

```
platform     → Entry point, combines everything
    ↓
api          → GraphQL API (Express/Fastify adapters)
    ↓
core         → Business logic orchestration
    ↓
core-*       → Domain modules (products, orders, users, etc.)
    ↓
infrastructure → Utilities (mongodb, events, logger)
```

### Key Constraints

- **DO NOT** import `@unchainedshop/mongodb` in the API layer
- Database logic belongs in `core-*` modules only
- Higher-level packages use module APIs, not direct DB access

### Plugin System

The Director/Adapter pattern powers extensibility:

```typescript
// Register a custom adapter
PaymentDirector.registerAdapter(MyCustomPaymentAdapter);
```

See [CLAUDE.md](CLAUDE.md) for detailed architecture documentation.

## Good First Issues

Look for these labels:

| Label | Description |
|-------|-------------|
| `good first issue` | Simple fixes, great for newcomers |
| `help wanted` | Features needing community input |
| `documentation` | Docs improvements |
| `bug` | Confirmed bugs needing fixes |

## Getting Help

### Resources

- **Documentation**: [docs.unchained.shop](https://docs.unchained.shop)
- **Discussions**: [GitHub Discussions](https://github.com/unchainedshop/unchained/discussions)
- **Architecture Guide**: [CLAUDE.md](CLAUDE.md)

### Using Claude Code

Unchained provides a Claude Code skill for AI-assisted contributions:

```bash
claude skill install https://docs.unchained.shop/skills/upgrade-unchained
```

The [CLAUDE.md](CLAUDE.md) file contains detailed context for Claude Code to assist with development.

### Contact

- **General questions**: Use GitHub Discussions
- **Security issues**: security@unchained.shop
- **Other inquiries**: hello@unchained.shop

---

Thank you for contributing to Unchained Engine!
