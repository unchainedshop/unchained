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
        res.status(404).end();
        return;
      }

      const token = await modules.warehousing.findToken({
        tokenId,
      });

      if (!token) {
        res.status(404).send('Token not found');
        return;
      }

      const { hash } = req.query;
      const correctHash = await modules.warehousing.buildAccessKeyForToken(tokenId);
      if (!hash || hash !== correctHash) {
        res.status(403).send('Token hash invalid for current owner');
        return;
      }

      const pass = await modules.passes.upsertGoogleWalletPass(token, resolvedContext);

      if (!pass) {
        throw new Error('Could not create Google Wallet pass');
      }

      res.redirect(await pass.asURL());
      return;
    } catch (e) {
      logger.error(e);
    }
    res.status(500).end();
    return;
  }
  res.status(404).end();
};

export default googleWalletHandler;
