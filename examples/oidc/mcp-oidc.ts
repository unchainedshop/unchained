import fastifyCookie from '@fastify/cookie';
import { API_EVENTS, Context, UnchainedContextResolver } from '@unchainedshop/api';
import { emit } from '@unchainedshop/events';
import { FastifyInstance, FastifyRequest } from 'fastify';
import FastifyOAuth2 from '@fastify/oauth2';
import jwt from 'jsonwebtoken';

const {
  MCP_API_PATH = '/mcp',
  ROOT_URL = 'http://localhost:4010',
} = process.env;


export default async function setupMCPOIDC(app: FastifyInstance, {
  clientId, discoveryUrl
}: { clientId: string, discoveryUrl: string }) {

  const discoveryResponse = await fetch(discoveryUrl);
  const discoveryData = await discoveryResponse.json();
  const jwksResponse = await fetch (discoveryData.jwks_uri);
  const jwksData = await jwksResponse.json();
  
  app.route({
    url: '/.well-known/oauth-protected-resource',
    method: ['GET'],
    handler: (req, reply) => {
      reply.header('Content-Type', 'application/json');
      return reply.send(
        JSON.stringify({
          resource: ROOT_URL,
          authorization_servers: [ROOT_URL],
          resource_documentation: 'https://docs.unchained.shop',
        }),
      );
    },
  });

  app.route({
    url: '/.well-known/oauth-authorization-server',
    method: ['GET'],
    handler: async (req, reply) => {
      reply.header('Content-Type', 'application/json');
      return reply.send(discoveryData);
    },
  });

  app.addHook('onRequest', async (req, reply) => {
    // Some code
    if (req.url === MCP_API_PATH) {
      try {
        const encodedToken = req.headers.authorization?.replace('Bearer ', '');
        const token = encodedToken
          ? jwt.verify(encodedToken, { key: jwksData?.keys[1], format: 'jwk' }, { complete: true })
          : null;
        (req as any).mcp = token;
      } catch {}
    }
  });
}
