import net from 'node:net';
import Fastify from 'fastify';
import { startPlatform } from '@unchainedshop/platform';
import { connect } from '@unchainedshop/api/fastify';
import { createTestDb } from '@unchainedshop/store';
import defaultModules from '@unchainedshop/plugins/presets/all.js';
import initPluginMiddlewares from '@unchainedshop/plugins/presets/all-fastify.js';

// Import additional discount plugins used by kitchensink
import '@unchainedshop/plugins/pricing/discount-half-price-manual.js';
import '@unchainedshop/plugins/pricing/discount-100-off.js';

let fastify = null;
let platform = null;
let serverPort = null;
let drizzleConnection = null;

// Check if a port is available
async function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port, '127.0.0.1');
  });
}

// Find a port where both port and port+1 are available (for Fastify and MongoDB)
async function findAvailablePortPair(startPort, maxAttempts = 100) {
  for (let port = startPort; port < startPort + maxAttempts; port++) {
    // Check both ports sequentially and verify both are free
    const fastifyPortOk = await isPortAvailable(port);
    if (!fastifyPortOk) continue;

    const mongoPortOk = await isPortAvailable(port + 1);
    if (!mongoPortOk) continue;

    return port;
  }
  throw new Error(`Could not find available port pair after ${maxAttempts} attempts`);
}

// Get a random starting port to avoid collisions with zombie processes
function getRandomStartPort() {
  // Use ports between 10000 and 50000 to avoid common service ports
  return 10000 + Math.floor(Math.random() * 40000);
}

export async function initializeTestPlatform() {
  if (platform) return platform;

  // Find available port pair before starting platform
  // MongoDB uses PORT+1, so we need both ports free
  // Use random starting port to avoid collisions with zombie processes from previous runs
  const port = await findAvailablePortPair(getRandomStartPort());
  serverPort = port;

  // Set PORT env var so initDb uses the correct port for MongoDB (PORT+1)
  process.env.PORT = String(port);
  // Set ROOT_URL dynamically so file upload URLs use the correct port
  process.env.ROOT_URL = `http://localhost:${port}`;

  // Create in-memory Drizzle SQLite database for tests
  drizzleConnection = createTestDb();

  // Start platform with in-memory MongoDB and Drizzle database
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

  // Start listening on the pre-checked port
  await fastify.listen({ port, host: '127.0.0.1' });

  // Access tokens are pre-configured in test seeds (tests/seeds/users.js)
  // No need to call setAccessToken - users are seeded with SHA-256 hashed tokens

  return platform;
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
  serverPort = null;
}

export function getTestPlatform() {
  if (!platform) {
    throw new Error('Test platform not initialized');
  }
  return platform;
}

export function getServerPort() {
  if (!serverPort) {
    throw new Error('Server not started');
  }
  return serverPort;
}

export function getDrizzleDb() {
  if (!drizzleConnection) {
    throw new Error('Drizzle database not initialized');
  }
  return drizzleConnection.db;
}
