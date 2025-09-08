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

    // Replace path.parse with URL/string methods
    const pathname = url.pathname;
    if (!pathname.toLowerCase().endsWith('.json')) throw new Error('Invalid ERC Metadata URI');

    const fileName = pathname.split('/').pop();
    const chainTokenId = fileName.slice(0, fileName.lastIndexOf('.'));

    const [, productId, localeOrTokenFilename, tokenFileName] = url.pathname.split('/');

    const product = await loaders.productLoader.load({ productId });

    const [token] = await modules.warehousing.findTokens({
      chainTokenId,
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
    res.status(200);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Length', new TextEncoder().encode(body).length);
    return res.send(body);
  } catch (e) {
    logger.error(e.message);
    res.writeHead(503);
    res.end(JSON.stringify({ name: e.name, code: e.code, message: e.message }));
    return;
  }
};

export default ercMetadataMiddleware;
