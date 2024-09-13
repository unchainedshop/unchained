import express from 'express';
import http from 'http';
import { startPlatform, setAccessToken } from '@unchainedshop/platform';
import baseModules from '@unchainedshop/plugins/presets/base-modules.js';
import connectBaseToExpress from '@unchainedshop/plugins/presets/base-express.js';
import { connect } from '@unchainedshop/api/express/index.js';
import { log } from '@unchainedshop/logger';
import seed from './seed.js';

const start = async () => {
  const app = express();
  const httpServer = http.createServer(app);

  const engine = await startPlatform({
    modules: baseModules,
  });

  await seed(engine.unchainedAPI);
  await setAccessToken(engine.unchainedAPI, 'admin', 'secret');

  await connect(app, engine);
  await connectBaseToExpress(app);

  await httpServer.listen({ port: process.env.PORT || 3000 });
  log(`🚀 Server ready at http://localhost:${process.env.PORT || 3000}`);
};

start();
