import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import type { YogaServerInstance } from 'graphql-yoga';
import { ALL_METHODS, internalServerError, type ConnectOptions } from '../http/createEndpoints.ts';
import { createFetchHandler } from '../http/createFetchHandler.ts';
import { getNodeHeader, sendWebResponse, toWebRequest } from '../http/nodeHttpBridge.ts';

export type { ConnectOptions } from '../http/createEndpoints.ts';

export const connect = async (
  server: Server,
  platform: { graphqlHandler: YogaServerInstance<any, any> },
  options: ConnectOptions = {},
) => {
  const handler = createFetchHandler(platform, options);
  const trustProxy = options.trustProxy || options.allowRemoteToLocalhostSecureCookies;

  const answer = async (req: IncomingMessage, res: ServerResponse) => {
    if (!ALL_METHODS.includes(req.method ?? '')) return undefined;
    const protocol = trustProxy && getNodeHeader(req, 'x-forwarded-proto')?.split(',')[0].trim();
    return handler(toWebRequest(req, res, { protocol: protocol || undefined }), {
      remoteAddress: req.socket.remoteAddress,
      remotePort: req.socket.remotePort,
      req,
      res,
    });
  };

  server.on('request', async (req, res) => {
    const response = await answer(req, res).catch((error) =>
      internalServerError(req.method ?? 'GET', req.url ?? '/', error),
    );
    await sendWebResponse(res, response ?? new Response('Not Found', { status: 404 })).catch(() =>
      res.destroy(),
    );
  });
};
