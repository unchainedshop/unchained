import express from 'express';
import http from 'node:http';

import { startPlatform, setAccessToken } from '@unchainedshop/platform';
import { connect } from '@unchainedshop/api/lib/express/index.js';
import defaultModules from '@unchainedshop/plugins/presets/all.js';
import connectDefaultPluginsToExpress from '@unchainedshop/plugins/presets/all-express.js';
import { log } from '@unchainedshop/logger';

import '@unchainedshop/plugins/pricing/discount-half-price-manual.js';
import '@unchainedshop/plugins/pricing/discount-100-off.js';

import seed from './seed.js';

const app = express();

// Workaround: Allow to use sandbox with localhost
app.set('trust proxy', 1);
app.use((req, res, next) => {
  req.headers['x-forwarded-proto'] = 'https';
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  next();
});

const httpServer = http.createServer(app);
const engine = await startPlatform({
  modules: defaultModules,
});

// Connect Unchained Engine to Express
connect(app, engine);
connectDefaultPluginsToExpress(app, engine);

const fileUrl = new URL(import.meta.resolve('../static/index.html'));
app.use('/', async (req, res) => {
  res.status(200).sendFile(fileUrl.pathname);
});

// Seed Database and Set a super insecure Access Token for admin
await seed(engine.unchainedAPI);

// Warning: Do not use this in production
await setAccessToken(engine.unchainedAPI, 'admin', 'secret');

await httpServer.listen({ port: process.env.PORT || 3000 });
log(`🚀 Server ready at http://localhost:${process.env.PORT || 3000}`);
