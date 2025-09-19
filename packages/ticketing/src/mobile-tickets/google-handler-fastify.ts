import { createLogger } from '@unchainedshop/logger';
import { TicketingAPI } from '../types.js';
import type { FastifyRequest, RouteHandlerMethod } from 'fastify';

const logger = createLogger('unchained:google-wallet-webservice');

const googleWalletHandler: RouteHandlerMethod = async (
  req: FastifyRequest & {
    unchainedContext: TicketingAPI;
  },
  reply,
) => {
  const resolvedContext = req.unchainedContext;
  const { modules } = resolvedContext;

  const path = req.url;

  logger.info(`${path} (${JSON.stringify(req.query)})`);

  if (path.startsWith('/download/')) {
    try {
      const [, , tokenId] = path.split('/');

      if (!tokenId) {
        reply.status(404);
        return reply.send();
      }

      const token = await modules.warehousing.findToken({
        tokenId,
      });

      if (!token) {
        logger.error('Token not found', { tokenId });
        reply.status(404);
        return reply.send();
      }

      const { hash } = req.query as Record<string, string>;
      const correctHash = await modules.warehousing.buildAccessKeyForToken(tokenId);
      if (hash !== correctHash) {
        logger.error('Token hash invalid for current owner', { tokenId });
        reply.status(403);
        return reply.send({
          success: false,
          message: 'Token hash invalid for current owner',
          name: 'HASH_MISMATCH',
        });
      }

      const pass = await modules.passes.upsertGoogleWalletPass(token, resolvedContext);
      return reply.redirect(await pass.asURL());
    } catch (e) {
      logger.error(e);
      reply.status(500);
      return reply.send({
        success: false,
        message: 'Error generating pass',
        name: 'PASS_GENERATION_ERROR',
      });
    }
  }
  reply.status(404);
  return reply.send();
};

export default googleWalletHandler;
