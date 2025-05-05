import fastifyCookie from '@fastify/cookie';
import { API_EVENTS, Context, UnchainedContextResolver } from '@unchainedshop/api';
import { emit } from '@unchainedshop/events';
import { FastifyInstance, FastifyRequest } from 'fastify';
import FastifyOAuth2 from '@fastify/oauth2';
import jwt from 'jsonwebtoken';

const {
  UNCHAINED_ZITADEL_CALLBACK_PATH = '/login/zitadel/callback',
  UNCHAINED_ZITADEL_CLIENT_ID,
  UNCHAINED_ZITADEL_DISCOVERY_URL,
  ROOT_URL = 'http://localhost:4010',
} = process.env;

const injectRolesInUser = async (
  userId: string,
  projectRoles: Record<string, Record<string, string>>,
  context: Context,
) => {
  const user = await context.modules.users.findUserById(userId);
  const roles = projectRoles ? Object.keys(projectRoles) : [];
  if (roles.join(':') !== user.roles.join(':')) {
    return await context.modules.users.updateRoles(user._id, roles);
  }
  return user;
};

export default async function setupZitadel(app: FastifyInstance) {
  if (!UNCHAINED_ZITADEL_CLIENT_ID || !UNCHAINED_ZITADEL_DISCOVERY_URL)
    throw new Error(
      'Environment variables UNCHAINED_ZITADEL_CLIENT_ID and UNCHAINED_ZITADEL_DISCOVERY_URL are required',
    );

  await app.register(fastifyCookie);

  app.register(FastifyOAuth2, {
    name: 'zitadel',
    credentials: {
      client: {
        id: UNCHAINED_ZITADEL_CLIENT_ID,
        secret: '',
      },
    },
    startRedirectPath: '/login',
    scope: ['profile', 'email', 'openid'],
    pkce: 'S256',
    callbackUri: `${ROOT_URL}${UNCHAINED_ZITADEL_CALLBACK_PATH}`,
    discovery: { issuer: UNCHAINED_ZITADEL_DISCOVERY_URL },
  });

  app.get(
    UNCHAINED_ZITADEL_CALLBACK_PATH,
    async function (
      this: FastifyInstance & {
        zitadel: FastifyOAuth2.OAuth2Namespace;
      },
      request: FastifyRequest & {
        unchainedContext: Context;
      },
      reply,
    ) {
      try {
        const accessToken = await this.zitadel.getAccessTokenFromAuthorizationCodeFlow(request);
        const decoded = jwt.decode(accessToken.token.id_token);
        const {
          sub,
          preferred_username,
          name,
          given_name,
          family_name,
          email,
          email_verified,
          [`urn:zitadel:iam:org:project:roles`]: projectRoles,
        } = decoded as {
          sub: string;
          preferred_username: string;
          name?: string;
          given_name?: string;
          family_name?: string;
          email?: string;
          email_verified: boolean;
          [`urn:zitadel:iam:org:project:roles`]: Record<string, Record<string, string>>;
        };

        const roles = Object.keys(projectRoles) || [];
        const userId = `${UNCHAINED_ZITADEL_CLIENT_ID}:${sub}`;
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
        request.session.zitadel = accessToken.token;
        return reply.redirect('http://localhost:4010/graphql');
      } catch (e) {
        console.error(e);
        reply.status(500);
        return reply.send();
      }
    },
  );

  return (contextResolver: UnchainedContextResolver) => async (props, req) => {
    const zitadelInstance = (app as any).zitadel as FastifyOAuth2.OAuth2Namespace;
    const context = await contextResolver(props);
    if (context.user || !req.session.zitadel) return context;

    try {
      const isExpired = new Date(req.session.zitadel.expires_at) < new Date();
      if (isExpired) {
        req.session.zitadel = (
          await zitadelInstance.getNewAccessTokenUsingRefreshToken(req.session.zitadel, {})
        ).token;
      }

      const {
        sub,
        [`urn:zitadel:iam:org:project:roles`]: projectRoles,
      }: {
        sub: string;
        [`urn:zitadel:iam:org:project:roles`]: Record<string, Record<string, string>>;
      } = jwt.decode(req.session.zitadel.id_token);

      const userId = `${UNCHAINED_ZITADEL_CLIENT_ID}:${sub}`;
      const user = await injectRolesInUser(userId, projectRoles, context);
      return {
        ...context,
        userId: user._id,
        user,
        logout: async () => {
          const tokenObject = {
            _id: (req as any).session.sessionId,
            userId: user._id,
          };
          delete req.session.zitadel;
          await emit(API_EVENTS.API_LOGOUT, tokenObject);
          return true;
        },
      };
    } catch {
      delete req.session.zitadel;
    }
    return context;
  };
}
