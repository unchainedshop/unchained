import express from 'express';
import http from 'http';
import { startPlatform, setAccessToken } from '@unchainedshop/platform';
// import { defaultModules, connectDefaultPluginsToExpress4 } from '@unchainedshop/plugins';
// import { connect } from '@unchainedshop/api/express/index.js';

import { log } from '@unchainedshop/logger';
import seed from './seed.js';

const start = async () => {
  const app = express();
  const httpServer = http.createServer(app);

  const engine = await startPlatform({});

  await seed(engine.unchainedAPI);
  await setAccessToken(engine.unchainedAPI, 'admin', 'secret');

  // await connect(app, engine);
  // connectDefaultPluginsToExpress4(app, engine);

  await httpServer.listen({ port: process.env.PORT || 3000 });
  log(`🚀 Server ready at http://localhost:${process.env.PORT || 3000}`);
};

start();
