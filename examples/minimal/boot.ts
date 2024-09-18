import { startPlatform, setAccessToken } from '@unchainedshop/platform';
import baseModules from '@unchainedshop/plugins/presets/base-modules.js';
// import connectBasePluginsToExpress from '@unchainedshop/plugins/presets/base-express.js';
import { connect } from '@unchainedshop/api/fastify/index.js';
import { log } from '@unchainedshop/logger';
import seed from './seed.js';
import Fastify from 'fastify';
import keycloak, { KeycloakOptions } from 'fastify-keycloak-adapter';

const start = async () => {
  const fastify = Fastify({
    logger: true,
  });

  const opts: KeycloakOptions = {
    appOrigin: 'http://localhost:4010',
    keycloakSubdomain: 'localhost:8080/realms/myrealm',
    useHttps: false,
    clientId: 'unchained-local',
    clientSecret: 'wahzLhkrnSTkPWCwbsZapNDMNT3PhHSX',
    disableCookiePlugin: true,
    disableSessionPlugin: true,
  };

  fastify.register(keycloak as any, opts);

  const engine = await startPlatform({
    modules: baseModules,
  });

  await seed(engine.unchainedAPI);
  await setAccessToken(engine.unchainedAPI, 'admin', 'secret');

  await connect(fastify, engine);
  // await connectBasePluginsToExpress(app);

  try {
    await fastify.listen({ port: process.env.PORT ? parseInt(process.env.PORT) : 3000 });
    log(`🚀 Server ready at http://localhost:${process.env.PORT || 3000}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
