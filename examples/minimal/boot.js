import Fastify from 'fastify';
import { startPlatform } from '@unchainedshop/platform';
import { connect } from '@unchainedshop/api/fastify';
import baseModules from '@unchainedshop/plugins/presets/base.js';
import initPluginMiddlewares from '@unchainedshop/plugins/presets/base-fastify.js';

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