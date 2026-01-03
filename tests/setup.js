import Fastify from 'fastify';
import { startPlatform } from '@unchainedshop/platform';
import { connect } from '@unchainedshop/api/fastify';
import { createTestDb } from '@unchainedshop/store';
import defaultModules from '@unchainedshop/plugins/presets/all.js';
import initPluginMiddlewares from '@unchainedshop/plugins/presets/all-fastify.js';
export { rebuildSearchIndexes } from '@unchainedshop/plugins/worker/search-index.js';

// Import additional discount plugins used by kitchensink
import '@unchainedshop/plugins/pricing/discount-half-price-manual.js';
import '@unchainedshop/plugins/pricing/discount-100-off.js';

let fastify = null;
let platform = null;
let drizzleConnection = null;

export async function initializeTestPlatform() {
  if (platform) {
    // Already initialized - return existing context
    const { port } = fastify.server.address();
    return { db: drizzleConnection.db, port, unchainedAPI: platform.unchainedAPI };
  }

  // Set a placeholder ROOT_URL (required by startPlatform, updated after we know the port)
  process.env.ROOT_URL = 'http://localhost:0';

  // Create in-memory Drizzle SQLite database for tests
  drizzleConnection = createTestDb();

  // FTS5 is now initialized automatically via the all-preset modules

  // Start platform with Drizzle database
  platform = await startPlatform({
    modules: defaultModules,
    drizzleDb: drizzleConnection.db,
    workQueueOptions: {
      // Workers enabled for work queue tests
      pollInterval: 500, // Process work every 500ms for faster tests
    },
  });

  // Create Fastify instance
  fastify = Fastify({
    disableRequestLogging: true,
    trustProxy: true,
  });

  // Connect platform to Fastify (registers all routes including gridfs for file uploads)
  connect(fastify, platform, { initPluginMiddlewares, allowRemoteToLocalhostSecureCookies: true });

  // Let Fastify choose an available port automatically (port 0)
  await fastify.listen({ port: 0, host: 'localhost' });

  // Update ROOT_URL with the actual port for file upload URLs
  const { port } = fastify.server.address();
  process.env.ROOT_URL = `http://localhost:${port}`;

  // Access tokens are pre-configured in test seeds (tests/seeds/users.js)
  // No need to call setAccessToken - users are seeded with SHA-256 hashed tokens

  return { db: drizzleConnection.db, port, unchainedAPI: platform.unchainedAPI };
}

export async function shutdownTestPlatform() {
  if (fastify) {
    await fastify.close();
    fastify = null;
  }
  if (platform) {
    await platform.graphqlHandler.dispose?.();
    platform = null;
  }
  if (drizzleConnection) {
    drizzleConnection.close();
    drizzleConnection = null;
  }
}

export function getTestPlatform() {
  if (!platform) {
    throw new Error('Test platform not initialized');
  }
  return platform;
}

export function getServerPort() {
  if (!fastify) {
    throw new Error('Server not started');
  }
  return fastify.server.address().port;
}

export function getDrizzleDb() {
  if (!drizzleConnection) {
    throw new Error('Drizzle database not initialized');
  }
  return drizzleConnection.db;
}
