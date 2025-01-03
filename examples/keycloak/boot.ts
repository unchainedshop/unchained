import { startPlatform, setAccessToken } from '@unchainedshop/platform';
import baseModules from '@unchainedshop/plugins/presets/base.js';
import connectBasePluginsToFastify from '@unchainedshop/plugins/presets/base-fastify.js';
import { connect } from '@unchainedshop/api/lib/fastify/index.js';
import { createLogger } from '@unchainedshop/logger';
import seed from './seed.js';
import Fastify, { FastifyInstance, FastifyRequest } from 'fastify';
import FastifyOAuth2 from '@fastify/oauth2';
import { Context } from '@unchainedshop/api';
import fastifyCookie from '@fastify/cookie';

const logger = createLogger('keycloak');

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

const app = Fastify({
  loggerInstance: new Logger(),
  disableRequestLogging: true,
  trustProxy: true,
});

// It's very important to await this, else the fastify-session plugin will not work
await app.register(fastifyCookie);

app.register(FastifyOAuth2, {
  name: 'keycloak',
  credentials: {
    client: {
      id: 'unchained-local',
      secret: 'NACOQslmea4kTki7SSKR4HTbAY91eRPe',
    },
  },
  startRedirectPath: '/login',
  scope: ['profile', 'email', 'phone', 'openid', 'address'],
  callbackUri: 'http://localhost:4010/login/keycloak/callback',
  discovery: { issuer: 'http://localhost:8080/realms/master' },
});

// Workaround: Allow to use sandbox with localhost
app.addHook('preHandler', async function (request) {
  request.headers['x-forwarded-proto'] = 'https';
});

app.addHook('onSend', async function (_, reply) {
  reply.headers({
    'Access-Control-Allow-Private-Network': 'true',
  });
});

const engine = await startPlatform({
  modules: baseModules,
});

app.get(
  '/login/keycloak/callback',
  async function (
    this: FastifyInstance & {
      keycloak: FastifyOAuth2.OAuth2Namespace;
    },
    request: FastifyRequest & {
      unchainedContext: Context;
    },
    reply,
  ) {
    const accessToken = await this.keycloak.getAccessTokenFromAuthorizationCodeFlow(request);
    try {
      const userinfo = await this.keycloak.userinfo(accessToken.token.access_token);
      const {
        sub,
        email,
        resource_access,
        email_verified,
        name,
        given_name,
        family_name,
        preferred_username,
      } = userinfo as {
        sub: string;
        email?: string;
        resource_access: Record<string, { roles: string[] }>;
        email_verified: boolean;
        name?: string;
        given_name?: string;
        family_name?: string;
        preferred_username: string;
      };

      const roles = resource_access?.['unchained-local']?.roles || [];
      const username = preferred_username || `keycloak:${sub}`;
      const user = await engine.unchainedAPI.modules.users.findUserByUsername(username);

      // eslint-disable-next-line
      // @ts-ignore
      request.session.keycloak = accessToken;

      if (user) {
        if (JSON.stringify(user.roles) !== JSON.stringify(roles)) {
          await engine.unchainedAPI.modules.users.updateRoles(user._id, roles);
        }
        await request.unchainedContext.login(user);
        return reply.redirect('/');
      }
      // TODO: try to use the preferred_username as the username first
      const newUserId = await engine.unchainedAPI.modules.users.createUser(
        {
          username,
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
      await request.unchainedContext.login(newUser);
      return reply.redirect('/');
    } catch (e) {
      console.error(e);
      reply.status(500);
      return reply.send();
    }
  },
);

// app.get(
//   '/impersonate',
//   async function (
//     this: FastifyInstance & {
//       keycloak: FastifyOAuth2.OAuth2Namespace;
//     },
//     request: FastifyRequest & {
//       unchainedContext: Context;
//     },
//     reply,
//   ) {
//     console.log(request.session);
//     const newToken = await this.keycloak.getNewAccessTokenUsingRefreshToken(
//       request.session.keycloak,
//       {},
//     );
//     request.session.keycloak = newToken;
//     const test = await fetch(
//       `http://localhost:8080/admin/realms/master/users/2399c45f-073b-4e96-abbf-85d9fef7b234/impersonation`,
//       {
//         method: 'POST',
//         headers: {
//           'content-type': 'application/json',
//           Authorization: `Bearer ${newToken.token.access_token}`,
//         },
//       },
//     );
//     console.log(test.headers);
//     return reply.send(await test.json());
//   },
// );

await seed(engine.unchainedAPI);
await setAccessToken(engine.unchainedAPI, 'admin', 'secret');

await connect(app, engine);
await connectBasePluginsToFastify(app);

try {
  await app.listen({ port: process.env.PORT ? parseInt(process.env.PORT) : 3000 });
} catch (err) {
  logger.error(err);
  process.exit(1);
}
