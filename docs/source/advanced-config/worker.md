---
title: 'Worker plugin'
description: 'Add custom worker'
---


```typescript
import type { IWorkerAdapter } from '@unchainedshop/types/worker';
import { WorkerDirector, WorkerAdapter } from '@unchainedshop/core-worker';
import { Context } from '@unchainedshop/api/context';

type Arg = {};
type Result = Arg;

export const SyncRulesWorkerPlugin: IWorkerAdapter<Arg, Result> = {
  ...WorkerAdapter,

  key: 'ch.shop.worker.sync-rules',
  label: 'Sync with CMS (Rules)',
  version: '1.0',

  type: 'SHOP_RULE_SYNC',

  async doWork(_, rawContext) {
    const appContext = rawContext as Context;
    logger.verbose('SyncRulesWorkerPlugin -> doWork');
    try {
      const amountOfRulesSynced =
        await appContext.modules.scopeRules.importFromCMS();
      return {
        success: true,
        result: { amountOfRulesSynced },
      };
    } catch (err) {
      return {
        success: false,
        error: {
          name: err.name,
          message: err.message,
          stack: err.stack,
        },
      };
    }
  },
};

```



```typescript
WorkerDirector.registerAdapter(SyncRulesWorkerPlugin);
```