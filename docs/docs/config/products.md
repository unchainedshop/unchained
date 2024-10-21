---
sidebar_position: 9
title: Products
sidebar_label: Products
---

:::
Configure the Products Module
:::


**Monkey patching the slugification**

You can override the default slugify function like that:

```
import { ProductTexts } from '@unchainedshop/core-products';
const oldMakeSlug = ProductTexts.makeSlug;
ProductTexts.makeSlug = rest =>
  oldMakeSlug(rest, {
    slugify: (title) => {
      return 'fu';
    }
  });
```
