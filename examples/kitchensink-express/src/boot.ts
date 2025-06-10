import express from 'express';
import http from 'node:http';
import { startPlatform, setAccessToken } from '@unchainedshop/platform';
import { connect } from '@unchainedshop/api/lib/express/index.js';
import defaultModules from '@unchainedshop/plugins/presets/all.js';
import connectDefaultPluginsToExpress from '@unchainedshop/plugins/presets/all-express.js';
import { createLogger } from '@unchainedshop/logger';
import { expressRouter } from '@unchainedshop/admin-ui'
import seed from './seed.js';
import { Experimental_StdioMCPTransport as StdioMCPTransport } from 'ai/mcp-stdio';
import { experimental_createMCPClient as createMCPClient } from 'ai';
import { streamText } from 'ai';
import cors from 'cors';
import { anthropic } from '@ai-sdk/anthropic';


export function errorHandler(error: unknown) {
  if (error == null) {
    return 'unknown error';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return JSON.stringify(error);
}


import '@unchainedshop/plugins/pricing/discount-half-price-manual.js';
import '@unchainedshop/plugins/pricing/discount-100-off.js';

const logger = createLogger('express');
const app = express();
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true

}));

const httpServer = http.createServer(app);
app.use(express.json());



try {
  const engine = await startPlatform({
    modules: defaultModules,
  });

  connect(app, engine, { allowRemoteToLocalhostSecureCookies: process.env.NODE_ENV !== 'production' });
  connectDefaultPluginsToExpress(app, engine);

  app.use('/', expressRouter);

  app.post('/chat', async (req, res) => {
    const { messages } = req.body;
    try {
      const client = await createMCPClient({
        transport: new StdioMCPTransport({
          command: "npx",
          args: ["-y", "supergateway", "--streamableHttp", "http://localhost:4010/mcp"],
          "env": {}
        }),
      });

      const tools = await client.tools();


      const result = streamText({
        model: anthropic('claude-4-sonnet-20250514'),
        messages,
        maxTokens: 1000,
        tools,
        onFinish: async () => {
          await client.close();
        },
      });

      result.pipeDataStreamToResponse(res, {
        getErrorMessage: errorHandler,
      });

    } catch (err) {
      res.status(500).json({ error: 'Failed to stream response' });
    }
  });


  // Seed Database and Set a super insecure Access Token for admin
  await seed(engine.unchainedAPI);

  // Warning: Do not use this in production
  await setAccessToken(engine.unchainedAPI, 'admin', 'secret');

  await httpServer.listen({ port: process.env.PORT || 3000 });
  logger.info(`🚀 Server ready at http://localhost:${process.env.PORT || 3000}`);
} catch (error) {
  logger.error(error);
  process.exit(1);
}
