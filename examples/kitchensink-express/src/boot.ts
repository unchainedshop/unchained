import express, { Request, Response } from 'express';
import http from 'node:http';
import { startPlatform, setAccessToken } from '@unchainedshop/platform';
import { connect } from '@unchainedshop/api/lib/express/index.js';
import defaultModules from '@unchainedshop/plugins/presets/all.js';
import connectDefaultPluginsToExpress from '@unchainedshop/plugins/presets/all-express.js';
import { createLogger } from '@unchainedshop/logger';
import { expressRouter } from '@unchainedshop/admin-ui'
import seed from './seed.js';
import { openai } from '@ai-sdk/openai';
import { CoreMessage, streamText, tool } from 'ai';
import { z } from 'zod';
import cors from 'cors';

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
  origin: 'http://localhost:3000', // 👈 replace with your frontend origin
  credentials: true                // 👈 allow cookies/authorization headers
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


  app.post('/chat', async (req: Request, res: Response) => {

    const messages: CoreMessage[] = [];
    try {
      const { messages } = req.body;


      const result = streamText({
        model: openai('gpt-4.1'),

        messages,
        tools: {
          getWeatherInformation: tool({
            description: 'Get the weather in a location (in Celsius)',
            parameters: z.object({
              location: z
                .string()
                .describe('The location to get the weather for'),
            }),
            execute: async ({ location }) => {
              console.log(location)
              return {
                location,
                temperature: Math.round((Math.random() * 30 + 5) * 10) / 10,
              }
            },
          }),
          convertCelsiusToFahrenheit: tool({
            description: 'Convert a temperature from Celsius to Fahrenheit',
            parameters: z.object({
              celsius: z
                .number()
                .describe('The temperature in Celsius to convert'),
            }),
            execute: async ({ celsius }) => {
              const fahrenheit = (celsius * 9) / 5 + 32;
              return { fahrenheit: Math.round(fahrenheit * 100) / 100 };
            },
          }),

        },
        maxSteps: 5,
        onStepFinish: step => {
          console.log(JSON.stringify(step, null, 2));
        },

      });
      let fullResponse = '';
      result.pipeDataStreamToResponse(res, {
        getErrorMessage: errorHandler
      });
      for await (const textPart of result.textStream) {
        console.log(textPart);
      }
      const reader = result.textStream.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        console.log(value);
      }
      process.stdout.write('\nAssistant: ');
      for await (const delta of result.textStream) {
        fullResponse += delta;
        process.stdout.write(delta);
      }
      process.stdout.write('\n\n');
      console.log('result', result.toolResults);
      const x = await result.toolResults;
      console.log(x)
      console.log('result.toolCalls ', await result.toolCalls);
      console.log('result.toolResults ', await result.toolResults);

      messages.push({ role: 'assistant', content: fullResponse });
    } catch (err) {
      console.error('Streaming error:', err);
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
