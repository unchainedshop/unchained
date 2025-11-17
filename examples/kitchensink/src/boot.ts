import Fastify from 'fastify';
import { createOpenAI } from '@ai-sdk/openai';
import { startPlatform } from '@unchainedshop/platform';
import { connect, unchainedLogger } from '@unchainedshop/api/fastify';
import defaultModules from '@unchainedshop/plugins/presets/all.js';
import initPluginMiddlewares from '@unchainedshop/plugins/presets/all-fastify.js';
import seed from './seed.ts';
import { useErrorHandler } from '@envelop/core';

import '@unchainedshop/plugins/pricing/discount-half-price-manual.js';
import '@unchainedshop/plugins/pricing/discount-100-off.js';
import { registerProductDiscoverabilityFilter } from '@unchainedshop/core';


export const modules = {
  ...defaultModules,
};

const fastify = Fastify({
  loggerInstance: unchainedLogger('fastify'),
  disableRequestLogging: true,
  trustProxy: true,
});


const provider = process.env.OPENAI_API_KEY && createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}); 

const imageProvider = process.env.OPENAI_API_KEY && createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

try {
  registerProductDiscoverabilityFilter({ hiddenTagValue: 'device' });

  const platform = await startPlatform({
    plugins: [
      useErrorHandler(({ errors }) => {
        for (const error of errors) {
          const { code: errorCode } = (error as any).extensions || {};
          if (!errorCode) continue;
          (error as any).path?.map((path) => {
            fastify.log.error(`${error.message} (${path} -> ${error.name})`);
          });
        }
      }),
    ],
    modules,
  });

  connect(fastify, platform, {
    allowRemoteToLocalhostSecureCookies: process.env.NODE_ENV !== 'production',
    adminUI: true,
    chat: provider ? {
      model: provider.chat(process.env.OPENAI_MODEL || "gpt-5.2"),
      imageGenerationTool: imageProvider ? { model: imageProvider.imageModel('gpt-image-1') } : undefined,
    } : undefined,
    initPluginMiddlewares,
  });
  await seed(platform.unchainedAPI);

  // Warning: Do not use this in production - creates access token for bulk import API
  const result = await platform.unchainedAPI.modules.users.createAccessToken('admin');
  if (result) {
    fastify.log.info(`Access token for admin: ${result.token}`);
  }

  await fastify.listen({ host: '::', port: process.env.PORT ? parseInt(process.env.PORT) : 3000 });




} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
