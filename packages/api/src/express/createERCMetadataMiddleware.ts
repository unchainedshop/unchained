import { IncomingMessage } from 'http';
import path from 'path';
import { createLogger } from '@unchainedshop/logger';
import { systemLocale } from '@unchainedshop/utils';
import { Context } from '../context.js';
import { WarehousingDirector } from '@unchainedshop/core';
import { WarehousingProviderType } from '@unchainedshop/core-warehousing';

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

export default async function ercMetadataMiddleware(
  req: IncomingMessage & { unchainedContext: Context },
  res,
) {
  try {
    if (req.method !== 'GET') {
      methodWrongHandler(res)();
      return;
    }

    const context = req.unchainedContext;
    const url = new URL(req.url, process.env.ROOT_URL);
    const parsedPath = path.parse(url.pathname);

    if (parsedPath.ext !== '.json') throw new Error('Invalid ERC Metadata URI');

    const [, productId, localeOrTokenFilename, tokenFileName] = url.pathname.split('/');

    const locale = tokenFileName ? localeOrTokenFilename : systemLocale.language;
    const chainTokenId = parsedPath.name;

    const product = await context.modules.products.findProduct({
      productId,
    });

    const [token] = await context.modules.warehousing.findTokens({
      chainTokenId,
      contractAddress: product?.tokenization?.contractAddress,
    });

    const virtualProviders = await context.modules.warehousing.findProviders({
      type: WarehousingProviderType.VIRTUAL,
    });

    const ercMetadata = await WarehousingDirector.tokenMetadata(
      virtualProviders,
      {
        product,
        token,
        locale: new Intl.Locale(locale),
        quantity: token?.quantity || 1,
        referenceDate: new Date(),
      },
      context,
    );

    const body = JSON.stringify(ercMetadata);
    res.writeHead(200, {
      'Content-Length': Buffer.byteLength(body),
      'Content-Type': 'text/plain',
    });
    res.end(body);
  } catch (e) {
    errorHandler(res)(e);
  }
}
