--- 
sidebar_position: 6
sidebar_label: Filters
title: Filters
---
# Filters
:::
Configure the Filters Module
:::


The module accepts the following keys

- setCachedProductIds
- getCachedProductIds

To support sorting other than the default order index, extend available sort codes:

```
extend enum SearchOrderBy {
   meta_priceRanges_minSimulatedPrice_DESC
   meta_priceRanges_minSimulatedPrice_ASC
}
```

Explanation:

DESC at the end means it should sort descending whereas ASC or neither direction means it will sort ascending. Underscores will be replaced by dots before firing to the MongoDB, so "meta_priceRanges_minSimulatedPrice_DESC" this effectively translates to:

```
{ $sort: { "meta.priceRanges.minSimulatedPrice": -1, "_id": 1 } }
```

