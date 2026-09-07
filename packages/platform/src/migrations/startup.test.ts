import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { after, before, describe, test } from 'node:test';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';

const exec = promisify(execFile);

describe('startup migration barrier', () => {
  let server: MongoMemoryServer;
  let client: MongoClient;

  before(async () => {
    server = await MongoMemoryServer.create();
    client = await MongoClient.connect(server.getUri());
  });

  after(async () => {
    await client?.close();
    await server?.stop();
  });

  for (const mode of ['disabled-option', 'disabled-env', 'failed-migration']) {
    test(`migrates before plugins and serving requests: ${mode}`, async () => {
      const db = client.db(mode);
      await db.collection('orders').insertOne({
        _id: 'historical' as any,
        currencyCode: 'CHF',
        calculation: [
          { category: 'ITEMS', amount: 10_000 },
          { category: 'TAXES', amount: 715, baseCategory: 'ITEMS' },
        ],
      });

      // Isolate platform singletons and environment switches from the test runner.
      const script = `
        import assert from 'node:assert/strict';
        import { startPlatform } from ${JSON.stringify(new URL('../startPlatform.ts', import.meta.url).href)};
        import { pluginRegistry, OrderPricingSheet } from '@unchainedshop/core';
        let pluginGross;
        pluginRegistry.register({
          key: 'test.migration-barrier', label: 'Migration barrier', version: '1.0.0',
          onRegister: async ({ modules }) => {
            const order = await modules.orders.findOrder({ orderId: 'historical' });
            pluginGross = OrderPricingSheet(order).gross();
          },
        });
        const options = {
          auditLog: false,
          workQueueOptions: { disableWorker: ${mode !== 'disabled-env'} },
          modules: {
            migrationProbe: {
              configure: ({ migrationRepository }) => {
                if (${mode === 'failed-migration'}) migrationRepository.register({
                  id: 20260907120001, name: 'Test failure',
                  up: async () => { throw new Error('conversion failed'); },
                });
                return {};
              },
            },
          },
        };
        try {
          if (${mode === 'failed-migration'}) {
            await assert.rejects(startPlatform(options), /conversion failed/);
            assert.equal(pluginGross, undefined);
          } else {
            const platform = await startPlatform(options);
            assert.equal(pluginGross, 10_000);
            const order = await platform.unchainedAPI.modules.orders.findOrder({ orderId: 'historical' });
            assert.equal(OrderPricingSheet(order).net(), 9_285);
            await platform.graphqlHandler.dispose();
          }
        } catch (error) {
          // Platform shutdown hooks must not turn an assertion failure into exit 0.
          console.error(error);
          process.exit(1);
        }
        // Failed startup must close its database connection and exit naturally.
        // Successful startup still owns resources managed by its shutdown hooks.
        if (${mode !== 'failed-migration'}) process.exit(0);
      `;
      await exec(process.execPath, ['--input-type=module', '--eval', script], {
        env: {
          ...process.env,
          NODE_ENV: 'test',
          MONGO_URL: server.getUri(mode),
          UNCHAINED_DISABLE_WORKER: mode === 'disabled-env' ? 'true' : '',
          UNCHAINED_TOKEN_SECRET: 'migration-test-secret-with-at-least-32-characters',
          EMAIL_WEBSITE_NAME: 'Migration test',
          EMAIL_WEBSITE_URL: 'http://localhost',
          EMAIL_FROM: 'migration@example.test',
          ROOT_URL: 'http://localhost',
        },
        timeout: 30_000,
      });
      assert.ok(await db.collection('last-migration').findOne({ _id: 20260907120000 as any }));
      assert.equal(
        await db.collection('last-migration').countDocuments({ _id: 20260907120001 as any }),
        0,
      );
    });
  }
});
