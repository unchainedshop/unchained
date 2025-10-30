import Fastify from 'fastify';
import { startPlatform } from '@unchainedshop/platform';
import baseModules from '@unchainedshop/plugins/presets/base.js';
import initPluginMiddlewares from '@unchainedshop/plugins/presets/base-fastify.js';
import { connect } from '@unchainedshop/api/fastify';

const fastify = Fastify();

const platform = await startPlatform({
  modules: baseModules,
});

connect(fastify, platform, {
  allowRemoteToLocalhostSecureCookies: true,
  initPluginMiddlewares,
  adminUI: true,
});

await fastify.listen({ host: '::', port: process.env.PORT ? parseInt(process.env.PORT) : 3000 });