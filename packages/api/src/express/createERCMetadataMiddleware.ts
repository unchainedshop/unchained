import { createLogger } from '@unchainedshop/logger';
import type { Context } from '../context.ts';
import type { Request, RequestHandler } from 'express';

const logger = createLogger('unchained:erc-metadata');

const methodWrongHandler = (res) => {
  logger.error('Method not supported, return 404');
  res.status(404).end();
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
    const { ROOT_URL = 'http://localhost:4010' } = process.env;

    const { services, modules, loaders, locale } = req.unchainedContext;
    const url = new URL(req.url, ROOT_URL);

    // Replace path.parse with URL/string methods
    const pathname = url.pathname;
    if (!pathname.toLowerCase().endsWith('.json')) throw new Error('Invalid ERC Metadata URI');

    const fileName = pathname.split('/').pop();

    if (!fileName) throw new Error('Invalid ERC Metadata URI');
    const tokenSerialNumber = fileName.slice(0, fileName.lastIndexOf('.'));

    const [, productId, localeOrTokenFilename, tokenFileName] = url.pathname.split('/');

    const product = await loaders.productLoader.load({ productId });

    const [token] = await modules.warehousing.findTokens({
      tokenSerialNumber,
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

    res.status(200);
    return res.send(ercMetadata);
  } catch (e) {
    logger.error(e);
    res.status(503);
    res.send({ name: e.name, code: e.code, message: e.message });
    return;
  }
};

export default ercMetadataMiddleware;
