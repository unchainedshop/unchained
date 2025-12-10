# @unchainedshop/shared

Shared TypeScript configuration for the Unchained Engine monorepo. This is a private package that provides common tsconfig settings.

## Contents

| File | Description |
|------|-------------|
| `base.tsconfig.json` | Base TypeScript configuration |
| `node-native.tsconfig.json` | Native Node.js TypeScript support configuration |

## Usage

Extend the shared configurations in your package's `tsconfig.json`:

```json
{
  "extends": "@unchainedshop/shared/base.tsconfig.json",
  "compilerOptions": {
    "outDir": "./lib",
    "rootDir": "./src"
  }
}
```

For native Node.js TypeScript support:

```json
{
  "extends": "@unchainedshop/shared/node-native.tsconfig.json",
  "compilerOptions": {
    "outDir": "./lib",
    "rootDir": "./src"
  }
}
```

## Note

This package is private and not published to npm. It's only used internally within the Unchained monorepo.
