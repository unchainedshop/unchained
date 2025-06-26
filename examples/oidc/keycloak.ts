import fastifyCookie from '@fastify/cookie';
import { API_EVENTS, Context, UnchainedContextResolver } from '@unchainedshop/api';
import { emit } from '@unchainedshop/events';
import { FastifyInstance, FastifyRequest } from 'fastify';
import FastifyOAuth2 from '@fastify/oauth2';
import jwt from 'jsonwebtoken';
import setupMCPOIDC from './mcp-oidc.js';

const {
  UNCHAINED_KEYCLOAK_CALLBACK_PATH = '/login/keycloak/callback',
  UNCHAINED_KEYCLOAK_CLIENT_ID,
  UNCHAINED_KEYCLOAK_CLIENT_SECRET,
  UNCHAINED_KEYCLOAK_REALM_URL,
  ROOT_URL = 'http://localhost:4010',
} = process.env;

export default async function setupKeycloak(app: FastifyInstance) {
  if (!UNCHAINED_KEYCLOAK_REALM_URL || !UNCHAINED_KEYCLOAK_CLIENT_ID)
    throw new Error(
      'Environment variables UNCHAINED_KEYCLOAK_CLIENT_ID and UNCHAINED_KEYCLOAK_REALM_URL are required',
    );

  await app.register(fastifyCookie);

  app.register(FastifyOAuth2, {
    name: 'keycloak',
    credentials: {
      client: {
        id: UNCHAINED_KEYCLOAK_CLIENT_ID,
        secret: UNCHAINED_KEYCLOAK_CLIENT_SECRET,
      },
    },
    startRedirectPath: '/login',
    scope: ['profile', 'email', 'openid'],
    callbackUri: `${ROOT_URL}${UNCHAINED_KEYCLOAK_CALLBACK_PATH}`,
    discovery: { issuer: UNCHAINED_KEYCLOAK_REALM_URL },
  });

  app.get(
    UNCHAINED_KEYCLOAK_CALLBACK_PATH,
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

        const roles = resource_access?.[UNCHAINED_KEYCLOAK_CLIENT_ID]?.roles || [];
        const userId = `${UNCHAINED_KEYCLOAK_CLIENT_ID}:${sub}`;
        const user = await request.unchainedContext.modules.users.findUserById(userId);
        const userByUsername =
          preferred_username &&
          (await request.unchainedContext.modules.users.findUserByUsername(preferred_username));
        const usernameAvailable =
          preferred_username && (!userByUsername || userByUsername._id === userId);

        if (!user) {
          await request.unchainedContext.modules.users.createUser(
            {
              // @ts-ignore WE KNOW THAT WE CAN SET THAT FIELD
              _id: userId,
              username: usernameAvailable ? preferred_username : sub,
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

  await setupMCPOIDC(app, {
    clientId: UNCHAINED_KEYCLOAK_CLIENT_ID,
    discoveryUrl: `${UNCHAINED_KEYCLOAK_REALM_URL}/.well-known/openid-configuration`,
  });

  return (contextResolver: UnchainedContextResolver) => async (props, req) => {
    const keycloakInstance = (app as any).keycloak as FastifyOAuth2.OAuth2Namespace;
    const context = await contextResolver(props);

    if (context.user) return context;

    if (req.mcp) {
      // TODO: Improve by adding the user and fetching it
      return {
        ...context,
        user: {
          roles: ["admin"]
        },
      };
    }
    
    if (!req.session.keycloak) return context;

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

      const userId = `${UNCHAINED_KEYCLOAK_CLIENT_ID}:${sub}`;
      let user = await context.modules.users.findUserById(userId);

      if (isExpired) {
        // only update roles when the token has been refreshed
        const roles = resource_access?.[UNCHAINED_KEYCLOAK_CLIENT_ID]?.roles || [];
        if (roles.join(':') !== user.roles.join(':')) {
          user = await context.modules.users.updateRoles(user._id, roles);
        }
      }

      return {
        ...context,
        userId: user._id,
        user,
        logout: async () => {
          const tokenObject = {
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
    return context;
  };
}
