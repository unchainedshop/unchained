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

  for (const mode of ['enabled-worker', 'disabled-option', 'disabled-env', 'failed-migration']) {
    test(`preserves initialization and migrates before workers and completed startup: ${mode}`, async () => {
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
        import { pluginRegistry, OrderPricingSheet, MessagingDirector } from '@unchainedshop/core';
        import { getAuditLogInstance, setEmitAdapter } from '@unchainedshop/events';
        const lifecycle = [];
        let readOrder;
        let pluginTimer;
        let auditClosed = false;
        setEmitAdapter({
          publish() {}, subscribe() {},
          shutdown() { lifecycle.push('emitter-shutdown'); },
        });
        pluginRegistry.register({
          key: 'test.migration-barrier', label: 'Migration barrier', version: '1.0.0',
          onRegister: ({ modules }) => {
            lifecycle.push('plugin');
            readOrder = () => modules.orders.findOrder({ orderId: 'historical' });
            pluginTimer = setInterval(() => {}, 60_000);
          },
          onShutdown: () => {
            clearInterval(pluginTimer);
            lifecycle.push('plugin-shutdown');
          },
        });
        const options = {
          auditLog: { log: false },
          plugins: [{
            onYogaInit: () => { lifecycle.push('api'); },
            onDispose: () => { lifecycle.push('api-shutdown'); },
          }],
          typeDefs: ['extend type Query { migrationGross: Int! }'],
          resolvers: [{ Query: {
            migrationGross: async () => OrderPricingSheet(await readOrder()).total().amount,
          } }],
          workQueueOptions: {
            disableWorker: ${mode === 'disabled-option'},
            invalidateProviders: false,
            skipInvalidationOnStartup: true,
            enabledQueueManagers: [{ actions: () => ({
              start() {
                assert.deepEqual(lifecycle, ['plugin', 'api', 'migration']);
                lifecycle.push('worker');
              },
              stop() {},
            }) }],
          },
          modules: {
            migrationProbe: {
              configure: ({ migrationRepository }) => {
                migrationRepository.register({
                  id: 20260907120001, name: 'Initialization probe',
                  up: async () => {
                    assert.deepEqual(lifecycle, ['plugin', 'api']);
                    assert.ok(MessagingDirector.getTemplate('ERROR_REPORT'));
                    const auditLog = getAuditLogInstance();
                    assert.ok(auditLog);
                    const closeAuditLog = auditLog.close.bind(auditLog);
                    auditLog.close = async () => {
                      await closeAuditLog();
                      auditClosed = true;
                    };
                    assert.equal(OrderPricingSheet(await readOrder()).gross(), 10_000);
                    lifecycle.push('migration');
                    if (${mode === 'failed-migration'}) throw new Error('conversion failed');
                  },
                });
                return {};
              },
            },
          },
        };
        try {
          if (${mode === 'failed-migration'}) {
            await assert.rejects(startPlatform(options), /conversion failed/);
            assert.deepEqual(lifecycle, [
              'plugin', 'api', 'migration', 'plugin-shutdown', 'emitter-shutdown', 'api-shutdown',
            ]);
            assert.equal(auditClosed, true);
          } else {
            const platform = await startPlatform(options);
            assert.deepEqual(lifecycle, [
              'plugin', 'api', 'migration', ...(${mode === 'enabled-worker'} ? ['worker'] : []),
            ]);
            const order = await platform.unchainedAPI.modules.orders.findOrder({ orderId: 'historical' });
            assert.equal(OrderPricingSheet(order).net(), 9_285);
            const response = await platform.graphqlHandler.fetch('http://localhost/graphql', {
              method: 'POST', headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ query: '{ migrationGross }' }),
            });
            assert.deepEqual(await response.json(), { data: { migrationGross: 10_000 } });
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
        mode === 'failed-migration' ? 0 : 1,
      );
    });
  }
});
