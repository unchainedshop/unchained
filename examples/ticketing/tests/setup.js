import net from 'node:net';
import Fastify from 'fastify';
import { startPlatform } from '@unchainedshop/platform';
import { connect } from '@unchainedshop/api/fastify';
import { stopDb } from '@unchainedshop/mongodb';
import ticketingServices from '@unchainedshop/ticketing/lib/services.js';
import setupTicketing, { ticketingModules } from '@unchainedshop/ticketing';
import defaultModules from '@unchainedshop/plugins/presets/all.js';
import configureAppleWalletPass from '@unchainedshop/ticketing/lib/pdf-tickets/configureAppleWalletPass.js';
import configureGoogleWalletPass from '@unchainedshop/ticketing/lib/pdf-tickets/configureGoogleWalletPass.js';
import connectBasePluginsToFastify from '@unchainedshop/plugins/presets/base-fastify.js';
import connectTicketingToFastify from '@unchainedshop/ticketing/lib/fastify.js';

let fastify = null;
let platform = null;
let serverPort = null;

// Configure Apple Wallet Pass (requires @walletpass/pass-js and certificates)
const createAppleWalletPass = process.env.PASS_TEAM_ID
  ? configureAppleWalletPass({
      templateConfig: {
        description: 'Event Ticket',
        organizationName: process.env.ORGANIZATION_NAME || 'Unchained Commerce',
        passTypeIdentifier: process.env.PASS_TYPE_IDENTIFIER || 'pass.com.example.ticket',
        teamIdentifier: process.env.PASS_TEAM_ID,
        backgroundColor: 'rgb(255,255,255)',
        foregroundColor: 'rgb(50,50,50)',
      },
      // Optional: customize field labels for localization
      labels: {
        eventLabel: 'Event',
        locationLabel: 'Venue',
        ticketNumberLabel: 'Ticket #',
        infoLabel: 'Details',
        slotChangeMessage: 'Event time changed: %@',
        barcodeHint: 'Scan for entry',
      },
    })
  : undefined;

// Configure Google Wallet Pass (requires googleapis and jsonwebtoken)
const createGoogleWalletPass = process.env.GOOGLE_WALLET_ISSUER_ID
  ? configureGoogleWalletPass({
      issuerName: process.env.ORGANIZATION_NAME || 'Unchained Commerce',
      countryCode: 'CH',
      hexBackgroundColor: '#FFFFFF',
      homepageUri: {
        uri: process.env.ROOT_URL || 'https://unchained.shop',
        description: 'Event Website',
      },
    })
  : undefined;

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

  // Start platform with in-memory MongoDB
  platform = await startPlatform({
    modules: { ...defaultModules, ...ticketingModules },
    services: { ...ticketingServices },
  });

  // Create Fastify instance
  fastify = Fastify({
    disableRequestLogging: true,
    trustProxy: true,
  });
  setupTicketing(platform.unchainedAPI, {
    // renderOrderPDF uses defaultTicketReceiptRenderer when not specified
    // For React-PDF based rendering, use:
    // renderOrderPDF: createPDFTicketRenderer(),
    createAppleWalletPass,
    createGoogleWalletPass,
  });
  // Connect platform to Fastify (registers all routes including gridfs for file uploads)
  connect(fastify, platform, {
    allowRemoteToLocalhostSecureCookies: true,
    initPluginMiddlewares: (app) => {
      connectBasePluginsToFastify(app);
      connectTicketingToFastify(app);
    },
  });

  // Start listening on the pre-checked port
  await fastify.listen({ port, host: '127.0.0.1' });
  console.log(`Test platform listening at http://localhost:${port}`);
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
