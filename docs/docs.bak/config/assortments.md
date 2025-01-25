---
sidebar_position: 2
title: Assortments
sidebar_label: Assortments

---
# Assortment

:::info
Configure the Assortments Module
:::

- setCachedProductIds:
- getCachedProductIds:
- zipTree: the default function build the tree in one direction.
- slugify: here the engine cleans the slug

Control the zip function to derive a flat sorted array of products out of an assortment tree:

```
import zipTreeBySimplyFlattening from "@unchainedshop/core-assortments/tree-zipper/zipTreeBySimplyFlattening"
const options = {
  modules: {
    assortments: {
      zipTree: zipTreeBySimplyFlattening
    },
  }
};
```

**Monkey patching the slugification**

You can override the default slugify function like that:

```
import { AssortmentTexts } from '@unchainedshop/core-products';
const oldMakeSlug = AssortmentTexts.makeSlug;
AssortmentTexts.makeSlug = rest =>
  oldMakeSlug(rest, {
    slugify: (title) => {
      return 'fu';
    }
  });
```

For more on Order module read the **[API]**