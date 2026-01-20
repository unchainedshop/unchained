import Fastify from 'fastify';
import { startPlatform } from '@unchainedshop/platform';
import { connect } from '@unchainedshop/api/fastify';
import { registerBasePlugins } from '@unchainedshop/plugins/presets/base';

const fastify = Fastify();

// Register base plugins before starting platform
registerBasePlugins();

const platform = await startPlatform({});
connect(fastify, platform, {
  allowRemoteToLocalhostSecureCookies: true,
  adminUI: true,
});

await fastify.listen({ host: '::', port: process.env.PORT ? parseInt(process.env.PORT) : 3000 });