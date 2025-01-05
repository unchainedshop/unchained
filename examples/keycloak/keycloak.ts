import fastifyCookie from '@fastify/cookie';
import { API_EVENTS, Context, UnchainedContextResolver } from '@unchainedshop/api';
import { emit } from '@unchainedshop/events';
import { FastifyInstance, FastifyRequest } from 'fastify';
import FastifyOAuth2 from '@fastify/oauth2';
import jwt from 'jsonwebtoken';

const {
  UNCHAINED_KEYCLOAK_CALLBACK_PATH = '/login/keycloak/callback',
  UNCHAINED_KEYCLOAK_CLIENT_ID = 'unchained-local',
  UNCHAINED_KEYCLOAK_CLIENT_SECRET,
  UNCHAINED_KEYCLOAK_REALM_URL = 'http://localhost:8080/realms/master',
  ROOT_URL = 'http://localhost:4010',
} = process.env;

export default async function setupKeycloak(app: FastifyInstance) {
  if (!UNCHAINED_KEYCLOAK_CLIENT_SECRET || UNCHAINED_KEYCLOAK_REALM_URL)
    throw new Error(
      'Environment variables UNCHAINED_KEYCLOAK_CLIENT_SECRET and UNCHAINED_KEYCLOAK_REALm_URL are required',
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

  return (contextResolver: UnchainedContextResolver) => async (props, req) => {
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

      let user = await context.modules.users.findUserById(`unchained-local:${sub}`);

      if (isExpired) {
        // only update roles when the token has been refreshed
        const roles = resource_access?.['unchained-local']?.roles || [];
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
    return context;
  };
}
