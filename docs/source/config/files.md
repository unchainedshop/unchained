---
title: "Module: Files"
description: Configure the Files Module
---

to set gridfs for all collections, use this:

```
{
  "unchained": {
    "files": {
      "default": {
        "storage": {
          "type": "gridfs"
        }
      }
    }
  }
}
```

all collections will use `default`, unless specified directly:

```
{
  "unchained": {
    "files": {
      "media": {
        "maxSize": 10485760
      }
    }
  }
}
```
