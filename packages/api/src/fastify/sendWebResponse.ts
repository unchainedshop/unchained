import { Readable } from 'node:stream';
import type { FastifyReply } from 'fastify';

export const sendFastifyWebResponse = (reply: FastifyReply, response: Response) => {
  reply.status(response.status);
  response.headers.forEach((value, key) => {
    if (key !== 'set-cookie') reply.header(key, value);
  });
  const setCookie = response.headers.getSetCookie();
  if (setCookie.length) reply.header('set-cookie', setCookie);

  if (!response.body) return reply.send();
  return reply.send(Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]));
};
