---
sidebar_position: 2
title: Products Options
sidebar_label: Products
---

```typescript
export interface ProductsSettingsOptions {
  slugify: (title: string) => string;
}
```

### Default Slugifier

- [slugify](https://github.com/unchainedshop/unchained/blob/master/packages/utils/src/slugify.ts)

### Custom Slugify

```typescript
import slugify from 'slugify';
const options = {
  modules: {
    products: {
      slugify
    },
  }
};
```