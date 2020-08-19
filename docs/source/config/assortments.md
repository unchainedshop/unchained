---
title: "Module: Assortments"
description: Configure the Assortments Module
---

Control the zip function to derive a flat sorted array of products out of an assortment tree:

```
import zipTreeBySimplyFlattening from "meteor/unchained:core-assortments/tree-zipper/zipTreeBySimplyFlattening"
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
import { AssortmentTexts } from 'meteor/unchained:core-products';
const oldMakeSlug = AssortmentTexts.makeSlug;
AssortmentTexts.makeSlug = rest =>
  oldMakeSlug(rest, {
    slugify: (title) => {
      return 'fu';
    }
  });
```
