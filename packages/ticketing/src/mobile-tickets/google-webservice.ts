import { createLogger } from '@unchainedshop/logger';
import { useMiddlewareWithCurrentContext } from '@unchainedshop/api/express/index.js';
import express, { Request, Response } from 'express';
import { TicketingAPI } from '../types.js';

const logger = createLogger('unchained:google-wallet-webservice');

const { GOOGLE_WALLET_WEBSERVICE_PATH = '/rest/google-wallet' } = process.env;

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
      console.error(e);
    }
    res.writeHead(500);
    res.end();
    return;
  }
  res.writeHead(404);
  res.end();
};

export default function loadGoogleWalletHandler(app) {
  useMiddlewareWithCurrentContext(
    app,
    GOOGLE_WALLET_WEBSERVICE_PATH,
    express.json({
      type: 'application/json',
    }),
    googleWalletHandler,
  );
}
