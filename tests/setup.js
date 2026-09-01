import net from 'node:net';
import { createServer } from 'node:http';
import Fastify from 'fastify';
import { startPlatform } from '@unchainedshop/platform';
import { connect } from '@unchainedshop/api/fastify';
import { stopDb } from '@unchainedshop/mongodb';
import { registerAllPlugins } from '@unchainedshop/plugins/presets/all';
import * as jose from 'jose';

// Import additional discount plugins used by kitchensink
import { HalfPriceManualPlugin } from '@unchainedshop/plugins/pricing/discount-half-price-manual';
import { HundredOffPlugin } from '@unchainedshop/plugins/pricing/discount-100-off';
import { pluginRegistry } from '@unchainedshop/core';

let fastify = null;
let platform = null;
let serverPort = null;

// Test OIDC keypair for backchannel logout tests
let oidcPrivateKey = null;
let oidcPublicKey = null;
export const TEST_OIDC_ISSUER = 'https://test-oidc-provider.example.com';
export const TEST_OIDC_AUDIENCE = 'test-client-id';

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

// In-process OTLP collector capturing the audit events the platform pushes,
// so integration tests can assert on the emitted OCSF payloads
let auditCollectorServer = null;
const capturedAuditEvents = [];

// Decodes an OTLP AnyValue back into a plain JS value
function anyValueToJs(value) {
  if ('stringValue' in value) return value.stringValue;
  if ('boolValue' in value) return value.boolValue;
  if ('intValue' in value) return Number(value.intValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('arrayValue' in value) return value.arrayValue.values.map(anyValueToJs);
  if ('kvlistValue' in value)
    return Object.fromEntries(
      value.kvlistValue.values.map(({ key, value: entry }) => [key, anyValueToJs(entry)]),
    );
  return null;
}

async function startAuditCollector() {
  auditCollectorServer = createServer((req, res) => {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      try {
        const body = JSON.parse(raw);
        for (const resourceLog of body.resourceLogs || []) {
          for (const scopeLog of resourceLog.scopeLogs || []) {
            for (const record of scopeLog.logRecords || []) {
              capturedAuditEvents.push(anyValueToJs(record.body));
            }
          }
        }
      } catch {
        // ignore malformed payloads
      }
      res.setHeader('content-type', 'application/json');
      res.end('{}');
    });
  });
  await new Promise((resolve) => auditCollectorServer.listen(0, '127.0.0.1', resolve));
  return auditCollectorServer.address().port;
}

export function getCapturedAuditEvents() {
  return capturedAuditEvents;
}

export function clearCapturedAuditEvents() {
  capturedAuditEvents.length = 0;
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

  // Register all plugins before starting platform
  registerAllPlugins();

  // Register additional discount plugins used by kitchensink
  pluginRegistry.register(HalfPriceManualPlugin);
  pluginRegistry.register(HundredOffPlugin);

  const auditCollectorPort = await startAuditCollector();

  // Start platform with in-memory MongoDB
  platform = await startPlatform({
    workQueueOptions: {
      // Workers enabled for work queue tests
      pollInterval: 500, // Process work every 500ms for faster tests
    },
    auditLog: {
      log: false, // keep test output readable
      collectorUrl: `http://127.0.0.1:${auditCollectorPort}/v1/logs`,
      batchSize: 1, // flush every event promptly so tests can assert on it
      flushIntervalMs: 100,
    },
  });

  // Generate OIDC test keypair for backchannel logout tests
  const keyPair = await jose.generateKeyPair('RS256');
  oidcPrivateKey = keyPair.privateKey;
  oidcPublicKey = keyPair.publicKey;

  // Create Fastify instance
  fastify = Fastify({
    disableRequestLogging: true,
    trustProxy: true,
  });

  // Serve JWKS for OIDC tests
  fastify.get('/.well-known/jwks.json', async () => {
    const jwk = await jose.exportJWK(oidcPublicKey);
    return { keys: [{ ...jwk, kid: 'test-key-id', use: 'sig', alg: 'RS256' }] };
  });

  // OIDC provider configuration for tests
  const oidcProviders = [
    {
      issuer: TEST_OIDC_ISSUER,
      jwksUri: `http://localhost:${port}/.well-known/jwks.json`,
      audience: TEST_OIDC_AUDIENCE,
    },
  ];

  // Connect platform to Fastify (registers all routes including gridfs for file uploads)
  await connect(fastify, platform, {
    allowRemoteToLocalhostSecureCookies: true,
    authConfig: {
      oidcProviders,
    },
  });

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
  if (auditCollectorServer) {
    await new Promise((resolve) => auditCollectorServer.close(resolve));
    auditCollectorServer = null;
  }
  // Stop MongoDB memory server to allow process to exit
  await stopDb();
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

export function getOidcPrivateKey() {
  if (!oidcPrivateKey) {
    throw new Error('OIDC keypair not initialized');
  }
  return oidcPrivateKey;
}
