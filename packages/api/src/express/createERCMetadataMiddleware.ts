import path from 'node:path';
import { createLogger } from '@unchainedshop/logger';
import { Context } from '../context.js';
import { Request, RequestHandler } from 'express';

const logger = createLogger('unchained:erc-metadata');

const errorHandler = (res) => (e) => {
  logger.error(e.message);
  res.writeHead(503);
  res.end(JSON.stringify({ name: e.name, code: e.code, message: e.message }));
};

const methodWrongHandler = (res) => () => {
  logger.error('Method not supported, return 404');
  res.writeHead(404);
  res.end();
};

const ercMetadataMiddleware: RequestHandler = async (
  req: Request & { unchainedContext: Context },
  res,
) => {
  try {
    if (req.method !== 'GET') {
      methodWrongHandler(res)();
      return;
    }

    const { services, localeContext } = req.unchainedContext;
    const url = new URL(req.url, process.env.ROOT_URL);
    const parsedPath = path.parse(url.pathname);

    if (parsedPath.ext !== '.json') throw new Error('Invalid ERC Metadata URI');

    const [, productId, localeOrTokenFilename, tokenFileName] = url.pathname.split('/');
    const locale = tokenFileName ? new Intl.Locale(localeOrTokenFilename) : localeContext;

    const ercMetadata = await services.warehousing.ercMetadata({
      productId,
      locale,
      chainTokenId: parsedPath.name,
    });

    if (!ercMetadata) {
      methodWrongHandler(res);
      return;
    }

    const body = JSON.stringify(ercMetadata);
    res.writeHead(200, {
      'Content-Length': Buffer.byteLength(body),
      'Content-Type': 'text/plain',
    });
    res.end(body);
  } catch (e) {
    errorHandler(res)(e);
  }
};

export default ercMetadataMiddleware;
