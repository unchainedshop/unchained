---
title: "Filter plugins"
description: Customize filter 
---



```typescript
import type { IFilterAdapter } from '@unchainedshop/types/filters';
import { FilterAdapter } from 'meteor/unchained:core-filters';

const ShopAttributeFilter: IFilterAdapter = {
  ...FilterAdapter,

  key: 'ch.shop.filter',
  label: 'Filters products by metadata attributes',
  version: '0.1',
  orderIndex: 10,

  actions: (params: FilterContext & Context): FilterAdapterActions => {
    return {
      ...FilterAdapter.actions(params),

      async transformSortStage(
    sort: FindOptions['sort'],
    options?: { key: string; value?: any }): Promise<FindOptions['sort']> {
        // eslint-disable-next-line no-unused-vars
        const { index = null, ...prevSort } = sort;
        return { ...prevSort };
      },

      async transformFilterSelector(query: Query, options?: any): Promise<Query> {
        if (!last || Object.keys(last).length === 0) {
          return null;
        }
        return last;
      },

      async transformProductSelector(query: Query, options?: { key?: string; value?: any }): Promise<Query> {
        if (!key) return last;
        return {
          status: 'ACTIVE',
          'shop.attributes': {
            $elemMatch: {
              key,
              value: value !== undefined ? value : { $exists: true },
            },
          },
        };
      },
    };
  },
};

```