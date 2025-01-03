import { startPlatform, setAccessToken } from '@unchainedshop/platform';
import baseModules from '@unchainedshop/plugins/presets/base.js';
import connectBasePluginsToFastify from '@unchainedshop/plugins/presets/base-fastify.js';
import { connect } from '@unchainedshop/api/lib/fastify/index.js';
import { createLogger } from '@unchainedshop/logger';
import seed from './seed.js';
import Fastify from 'fastify';

const logger = createLogger('minimal');

function Logger(...args) {
  this.args = args;
}
Logger.prototype.info = logger.info;
Logger.prototype.error = logger.error;
Logger.prototype.debug = logger.debug;
Logger.prototype.fatal = logger.error;
Logger.prototype.warn = logger.warn;
Logger.prototype.trace = logger.trace;
Logger.prototype.child = function () {
  return new Logger();
};

const start = async () => {
  const fastify = Fastify({
    loggerInstance: new Logger(),
    disableRequestLogging: true,
    trustProxy: true,
  });

  // Workaround: Allow to use sandbox with localhost
  fastify.addHook('preHandler', async function (request) {
    request.headers['x-forwarded-proto'] = 'https';
  });

  fastify.addHook('onSend', async function (_, reply) {
    reply.headers({
      'Access-Control-Allow-Private-Network': 'true',
    });
  });

  const engine = await startPlatform({
    modules: baseModules,
  });

  await seed(engine.unchainedAPI);
  await setAccessToken(engine.unchainedAPI, 'admin', 'secret');

  await connect(fastify, engine);
  await connectBasePluginsToFastify(fastify);

  try {
    await fastify.listen({ port: process.env.PORT ? parseInt(process.env.PORT) : 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
