import { startPlatform, setAccessToken } from '@unchainedshop/platform';
import baseModules from '@unchainedshop/plugins/lib/presets/base-modules.js';
// import connectBasePluginsToExpress from '@unchainedshop/plugins/presets/base-express.js';
import { connect } from '@unchainedshop/api/lib/fastify/index.js';
import { log } from '@unchainedshop/logger';
import seed from './seed.js';
import Fastify from 'fastify';
import FastifyOAuth2 from '@fastify/oauth2';

const start = async () => {
  const fastify = Fastify({
    logger: true,
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

  fastify.register(FastifyOAuth2, {
    name: 'keycloak',
    credentials: {
      client: {
        id: 'unchained-local',
        secret: 'n7L0X7Wo7mLkSIfLKvvAqZpNpcOVncKd',
      },
    },
    startRedirectPath: '/login',
    scope: ['profile', 'email', 'openid', 'address'],
    callbackUri: 'http://localhost:4010/callback',
    discovery: { issuer: 'http://localhost:8080/realms/myrealm' },
  });

  fastify.get('/callback', async function (request, reply) {
    const accessToken = await this.keycloak.getAccessTokenFromAuthorizationCodeFlow(request);
    try {
      const userinfo = await this.keycloak.userinfo(accessToken.token.access_token);
      const { sub, email, resource_access, email_verified, name, given_name, family_name } = userinfo;
      const roles = resource_access?.['unchained-local']?.roles || [];
      const user = await engine.unchainedAPI.modules.users.findUserByUsername(`keycloak:${sub}`);

      if (user) {
        if (JSON.stringify(user.roles) !== JSON.stringify(roles)) {
          await engine.unchainedAPI.modules.users.updateRoles(user._id, roles);
        }
        request.unchainedContext.login(user);
        return reply.redirect('/');
      }
      // TODO: try to use the preferred_username as the username first
      const newUserId = await engine.unchainedAPI.modules.users.createUser(
        {
          username: `keycloak:${sub}`,
          password: null,
          email: email_verified ? email : undefined,
          profile: {
            displayName: name,
            address: {
              firstName: given_name,
              lastName: family_name,
            },
          },
          roles,
        },
        { skipMessaging: true, skipPasswordEnrollment: true },
      );
      const newUser = await engine.unchainedAPI.modules.users.findUserById(newUserId);
      request.unchainedContext.login(newUser);
      return reply.redirect('/');
    } catch (e) {
      console.error(e);
    }

    // if later need to refresh the token this can be used
    // const { token: newToken } = await this.getNewAccessTokenUsingRefreshToken(token)

    return reply.send({ access_token: token.access_token });
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
