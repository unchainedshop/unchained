import { createLogger } from '@unchainedshop/logger';
import { UnchainedCore } from '@unchainedshop/types/core';
import { systemLocale } from '@unchainedshop/utils';
import { IncomingMessage } from 'http';
import localePkg from 'locale';
import path from 'path';
import { useMiddlewareWithCurrentContext } from './context';

const { Locale } = localePkg;

const logger = createLogger('unchained:erc-metadata');

const { ERC_METADATA_API_PATH = '/erc-metadata' } = process.env;

const errorHandler = (res) => (e) => {
  logger.error(e.message);
  res.writeHead(503);
  res.end(JSON.stringify(e));
};

const methodWrongHandler = (res) => () => {
  logger.error('Method not supported, return 404');
  res.writeHead(404);
  res.end();
};

const ercMetadataMiddleware = async (
  req: IncomingMessage & { unchainedContext?: UnchainedCore },
  res,
) => {
  try {
    if (req.method !== 'GET') {
      methodWrongHandler(res)();
      return;
    }

    const resolvedContext = req.unchainedContext;

    const url = new URL(req.url, process.env.ROOT_URL);
    const parsedPath = path.parse(url.pathname);

    if (parsedPath.ext !== '.json') throw new Error('Invalid ERC Metadata URI');

    const locale = parsedPath.dir === '/' ? systemLocale.language : parsedPath.name;
    const tokenId = parsedPath.dir === '/' ? parsedPath.name : parsedPath.dir.substring(1);

    const [product] = await resolvedContext.modules.products.findProducts({
      productSelector: { 'tokenization.tokenId': tokenId },
    });

    const ercMetadata = await resolvedContext.services.products.ercMetadata(
      {
        product,
        locale: new Locale(locale),
      },
      resolvedContext,
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
};

export default (expressApp) => {
  useMiddlewareWithCurrentContext(expressApp, ERC_METADATA_API_PATH, ercMetadataMiddleware);
};
