import { createLogger } from '@unchainedshop/logger';
import type { Request, Response } from 'express';
import { TicketingAPI } from '../types.js';

const logger = createLogger('unchained:google-wallet-webservice');

export const googleWalletHandler = async (
  req: Request & { unchainedContext: TicketingAPI },
  res: Response,
) => {
  const resolvedContext = req.unchainedContext;
  const { modules } = resolvedContext;
  logger.info(`${req.path} (${JSON.stringify(req.query)})`);

  if (req.path.startsWith('/download/')) {
    try {
      const [, , tokenId] = req.path.split('/');

      if (!tokenId) {
        res.writeHead(404);
        res.end();
        return;
      }

      const token = await modules.warehousing.findToken({
        tokenId,
      });

      if (!token) {
        res.writeHead(404);
        res.end('Token not found');
        return;
      }

      const { hash } = req.query;
      const correctHash = await modules.warehousing.buildAccessKeyForToken(tokenId);
      if (hash !== correctHash) {
        res.writeHead(403);
        res.end('Token hash invalid for current owner');
        return;
      }

      const pass = await modules.passes.upsertGoogleWalletPass(token, resolvedContext);

      res.redirect(await pass.asURL());
      return;
    } catch (e) {
      logger.error(e);
    }
    res.writeHead(500);
    res.end();
    return;
  }
  res.writeHead(404);
  res.end();
};

export default googleWalletHandler;
