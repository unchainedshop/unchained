# Core Options

To configure core modules, pass options for every core package to `startPlatform`:

```ts
  const engine = await startPlatform({
    ...
    options: {
      orders: {
        ensureUserHasCart: true,
      },
    },
    ...
  });
```

Check the next pages for all module options available.