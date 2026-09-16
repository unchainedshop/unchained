import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { after, before, describe, test } from 'node:test';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';

const exec = promisify(execFile);

describe('worker-only startup migrations', () => {
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
    test(`runs migrations only on workers and continues startup after migration failure: ${mode}`, async () => {
      const db = client.db(mode);
      const workerEnabled = mode === 'enabled-worker' || mode === 'failed-migration';
      const migrationSucceeded = mode === 'enabled-worker';

      // Isolate platform singletons and environment switches from the test runner.
      // A synthetic probe migration writes a marker and asserts the initialization
      // order independently of any specific migration.
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
          key: 'test.worker-migrations', label: 'Worker migrations', version: '1.0.0',
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
          const platform = await startPlatform(options);
          assert.deepEqual(lifecycle, [
            'plugin', 'api', ...(${workerEnabled} ? ['migration', 'worker'] : []),
          ]);
          assert.equal(auditClosed, false);
          const marker = await platform.unchainedAPI.modules.migrationProbe.readProbe();
          assert.equal(Boolean(marker?.migratedBeforeServing), ${migrationSucceeded});
          const response = await platform.graphqlHandler.fetch('http://localhost/graphql', {
            method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ query: '{ migratedBeforeServing }' }),
          });
          assert.deepEqual(await response.json(), {
            data: { migratedBeforeServing: ${migrationSucceeded} },
          });
          await platform.graphqlHandler.dispose();
        } catch (error) {
          // Platform shutdown hooks must not turn an assertion failure into exit 0.
          console.error(error);
          process.exit(1);
        }
        // The running platform still owns resources managed by its shutdown hooks.
        process.exit(0);
      `;
      const { stdout, stderr } = await exec(
        process.execPath,
        ['--input-type=module', '--eval', script],
        {
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
        },
      );
      if (mode === 'failed-migration') {
        assert.match(stdout + stderr, /Migration failed; continuing startup/);
        assert.match(stdout + stderr, /conversion failed/);
      }

      // Disabled workers and failed migrations must not record completion.
      assert.equal(
        await db.collection('last-migration').countDocuments({ _id: 20260907120001 as any }),
        migrationSucceeded ? 1 : 0,
      );
      assert.equal(
        await db.collection('startup_probe').countDocuments({ _id: 'probe' as any }),
        migrationSucceeded ? 1 : 0,
      );
    });
  }
});
