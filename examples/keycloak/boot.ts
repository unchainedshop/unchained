import { startPlatform, setAccessToken } from '@unchainedshop/platform';
import baseModules from '@unchainedshop/plugins/presets/base.js';
import connectBasePluginsToFastify from '@unchainedshop/plugins/presets/base-fastify.js';
import { connect } from '@unchainedshop/api/lib/fastify/index.js';
import { createLogger } from '@unchainedshop/logger';
import seed from './seed.js';
import Fastify, { FastifyInstance, FastifyRequest } from 'fastify';
import FastifyOAuth2 from '@fastify/oauth2';
import { Context, UnchainedContextResolver, API_EVENTS } from '@unchainedshop/api';
import fastifyCookie from '@fastify/cookie';
import { emit } from '@unchainedshop/events';
import jwt from 'jsonwebtoken';

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
  scope: ['profile', 'email', 'openid'],
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
  context: (contextResolver: UnchainedContextResolver) => async (props, req) => {
    // eslint-disable-next-line
    const keycloakInstance = (app as any).keycloak as FastifyOAuth2.OAuth2Namespace;
    const context = await contextResolver(props);
    if (context.user || !req.session.keycloak) return context;
    try {
      const isExpired = new Date(req.session.keycloak.expires_at) < new Date();
      if (isExpired) {
        req.session.keycloak = (
          await keycloakInstance.getNewAccessTokenUsingRefreshToken(req.session.keycloak, {})
        ).token;
      }

      const {
        sub,
        resource_access,
      }: {
        sub: string;
        resource_access: Record<string, { roles: string[] }>;
      } = jwt.decode(req.session.keycloak.id_token);

      const roles = resource_access?.['unchained-local']?.roles || [];
      let user = await context.modules.users.findUserById(`unchained-local:${sub}`);
      if (roles.join(':') !== user.roles.join(':')) {
        user = await context.modules.users.updateRoles(user._id, roles);
      }

      return {
        ...context,
        userId: user._id,
        user,
        logout: async () => {
          const tokenObject = {
            // eslint-disable-next-line
            _id: (req as any).session.sessionId,
            userId: user._id,
          };
          delete req.session.keycloak;
          await emit(API_EVENTS.API_LOGOUT, tokenObject);
          return true;
        },
      };
    } catch {
      delete req.session.keycloak;
    }
    return {
      ...context,
    };
  },
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
    try {
      const accessToken = await this.keycloak.getAccessTokenFromAuthorizationCodeFlow(request);
      const decoded = jwt.decode(accessToken.token.id_token);
      const {
        sub,
        resource_access,
        preferred_username,
        name,
        given_name,
        family_name,
        email,
        email_verified,
      } = decoded as {
        sub: string;
        resource_access: Record<string, { roles: string[] }>;
        preferred_username: string;
        name?: string;
        given_name?: string;
        family_name?: string;
        email?: string;
        email_verified: boolean;
      };

      const roles = resource_access?.['unchained-local']?.roles || [];
      const username = preferred_username || `unchained-local:${sub}`;
      const user = await request.unchainedContext.modules.users.findUserByUsername(username);

      if (!user) {
        await request.unchainedContext.modules.users.createUser(
          {
            // eslint-disable-next-line
            // @ts-ignore WE KNOW THAT WE CAN SET THAT FIELD
            _id: `unchained-local:${sub}`,
            username,
            password: null,
            email: email_verified ? email : null,
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
      }
      // eslint-disable-next-line
      // @ts-ignore
      request.session.keycloak = accessToken.token;
      return reply.redirect('http://localhost:3000/');
    } catch (e) {
      console.error(e);
      reply.status(500);
      return reply.send();
    }
  },
);

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
