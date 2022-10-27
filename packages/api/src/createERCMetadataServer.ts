import { createLogger } from '@unchainedshop/logger';
import { Context } from '@unchainedshop/types/api';
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
  res.end(JSON.stringify({ name: e.name, code: e.code, message: e.message }));
};

const methodWrongHandler = (res) => () => {
  logger.error('Method not supported, return 404');
  res.writeHead(404);
  res.end();
};

const ercMetadataMiddleware = async (req: IncomingMessage & { unchainedContext?: Context }, res) => {
  try {
    if (req.method !== 'GET') {
      methodWrongHandler(res)();
      return;
    }

    const resolvedContext = req.unchainedContext;

    const url = new URL(req.url, process.env.ROOT_URL);
    const parsedPath = path.parse(url.pathname);

    if (parsedPath.ext !== '.json') throw new Error('Invalid ERC Metadata URI');

    const [, productIdOrContractAddress, localeOrTokenFilename, tokenFileName] = url.pathname.split('/');

    const locale = tokenFileName ? localeOrTokenFilename : systemLocale.language;
    const chainTokenId = parsedPath.name;

    const productByProductId = await resolvedContext.modules.products.findProduct({
      productId: productIdOrContractAddress,
    });

    const selector: any = {
      chainTokenId,
      contractAddress: productByProductId?.tokenization?.contractAddress || productIdOrContractAddress,
    };
    const [token] = await resolvedContext.modules.warehousing.findTokens(selector);

    const product =
      productByProductId ||
      (await resolvedContext.modules.products.findProduct({
        productId: token?.productId,
      }));

    const ercMetadata = await resolvedContext.modules.warehousing.tokenMetadata(
      token,
      {
        product,
        referenceDate: new Date(),
      },
      { ...resolvedContext, localeContext: new Locale(locale) },
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
