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

      // Isolate platform singletons and environment switches from the test runner.
      // A synthetic probe migration writes a marker and asserts the initialization
      // order; the barrier itself is independent of any specific migration.
      const script = `
        import assert from 'node:assert/strict';
        import { startPlatform } from ${JSON.stringify(new URL('../startPlatform.ts', import.meta.url).href)};
        import { pluginRegistry, MessagingDirector } from '@unchainedshop/core';
        import { getAuditLogInstance, setEmitAdapter } from '@unchainedshop/events';
        const lifecycle = [];
        let pluginTimer;
        let readProbe;
        let auditClosed = false;
        setEmitAdapter({
          publish() {}, subscribe() {},
          shutdown() { lifecycle.push('emitter-shutdown'); },
        });
        pluginRegistry.register({
          key: 'test.migration-barrier', label: 'Migration barrier', version: '1.0.0',
          onRegister: ({ modules }) => {
            lifecycle.push('plugin');
            readProbe = () => modules.migrationProbe.readProbe();
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
          typeDefs: ['extend type Query { migratedBeforeServing: Boolean! }'],
          resolvers: [{ Query: {
            migratedBeforeServing: async () =>
              Boolean((await readProbe())?.migratedBeforeServing),
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
                const probe = migrationRepository.db.collection('startup_probe');
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
                    lifecycle.push('migration');
                    if (${mode === 'failed-migration'}) throw new Error('conversion failed');
                    await probe.insertOne({ _id: 'probe', migratedBeforeServing: true });
                  },
                });
                return { readProbe: () => probe.findOne({ _id: 'probe' }) };
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
            const marker = await platform.unchainedAPI.modules.migrationProbe.readProbe();
            assert.equal(marker?.migratedBeforeServing, true);
            const response = await platform.graphqlHandler.fetch('http://localhost/graphql', {
              method: 'POST', headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ query: '{ migratedBeforeServing }' }),
            });
            assert.deepEqual(await response.json(), { data: { migratedBeforeServing: true } });
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

      // Migrations recorded exactly once on success, and the failed migration neither
      // records itself nor leaves its marker behind.
      assert.equal(
        await db.collection('last-migration').countDocuments({ _id: 20260907120001 as any }),
        mode === 'failed-migration' ? 0 : 1,
      );
      assert.equal(
        await db.collection('startup_probe').countDocuments({ _id: 'probe' as any }),
        mode === 'failed-migration' ? 0 : 1,
      );
    });
  }
});
