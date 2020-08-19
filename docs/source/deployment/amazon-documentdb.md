---
title: "Amazon Document DB"
description: Amazon Document DB Compatibility Mode
---

Set AMAZON_DOCUMENTDB_COMPAT_MODE to trueish if you use Amazon DocumentDB or an old MongoDB version pre 3.6.

Downsides:

- assortment shuffling and product sorting in assortments will not work, it will be random
- local search plugin will do regex search instead of fulltext search, a search engine is required for full text search
