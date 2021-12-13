import { Db } from '@unchainedshop/types/common';
import { WorkerModule } from '@unchainedshop/types/worker';
import { assert } from 'chai';
import {
  configureWorkerModule,
  WorkerDirector,
} from 'meteor/unchained:core-worker';
import { initDb } from 'meteor/unchained:mongodb';

import ExternalWorkerPlugin from '../plugins/external';

describe('Test exports', () => {
  let module: WorkerModule;
  let db: Db;

  before(async () => {
    db = initDb();
    module = await configureWorkerModule({ db }).catch((error) => {
      console.warn('ERROR', error);
      return null;
    });
    assert.ok(module);
  });

  it('Check queries', () => {
    assert.isFunction(module.addWork);
  });

  it('Check director', () => {
    WorkerDirector.doWork({ type: ExternalWorkerPlugin.type });
  });
});
