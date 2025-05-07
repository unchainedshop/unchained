import path from 'node:path';
import { createLogger } from '@unchainedshop/logger';
import { Context } from '../context.js';
import { Request, RequestHandler } from 'express';

const logger = createLogger('unchained:erc-metadata');

const { ROOT_URL = 'http://localhost:4010' } = process.env;

const methodWrongHandler = (res) => {
  logger.error('Method not supported, return 404');
  res.writeHead(404);
  res.end();
  return;
};

const ercMetadataMiddleware: RequestHandler = async (
  req: Request & { unchainedContext: Context },
  res,
) => {
  try {
    if (req.method !== 'GET') {
      return methodWrongHandler(res);
    }

    const { services, modules, loaders, locale } = req.unchainedContext;
    const url = new URL(req.url, ROOT_URL);
    const parsedPath = path.parse(url.pathname);

    if (parsedPath.ext !== '.json') throw new Error('Invalid ERC Metadata URI');

    const [, productId, localeOrTokenFilename, tokenFileName] = url.pathname.split('/');

    const product = await loaders.productLoader.load({ productId });

    const [token] = await modules.warehousing.findTokens({
      chainTokenId: parsedPath.name,
      contractAddress: product?.tokenization?.contractAddress,
    });

    const ercMetadata = await services.warehousing.ercMetadata({
      product,
      token,
      locale: tokenFileName ? new Intl.Locale(localeOrTokenFilename) : locale,
    });

    if (!ercMetadata) {
      return methodWrongHandler(res);
    }

    const body = JSON.stringify(ercMetadata);
    res.writeHead(200, {
      'Content-Length': Buffer.byteLength(body),
      'Content-Type': 'text/plain',
    });
    res.end(body);
  } catch (e) {
    logger.error(e.message);
    res.writeHead(503);
    res.end(JSON.stringify({ name: e.name, code: e.code, message: e.message }));
    return;
  }
};

export default ercMetadataMiddleware;
