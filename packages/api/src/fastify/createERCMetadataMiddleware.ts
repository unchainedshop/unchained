import path from 'path';
import { createLogger } from '@unchainedshop/logger';
import { systemLocale } from '@unchainedshop/utils';
import { Context } from '../context.js';
import { FastifyRequest, RouteHandlerMethod } from 'fastify';

const logger = createLogger('unchained:erc-metadata');

const errorHandler = (res) => (e) => {
  logger.error(e.message);
  res.status(503);
  return res.send(JSON.stringify({ name: e.name, code: e.code, message: e.message }));
};

const methodWrongHandler = (res) => {
  logger.error('Method not supported, return 404');
  res.status(404);
  return res.send();
};

const ercMetadataMiddleware: RouteHandlerMethod = async (
  req: FastifyRequest & { unchainedContext: Context },
  res,
) => {
  try {
    if (req.method !== 'GET') {
      return methodWrongHandler(res);
    }

    const { services } = req.unchainedContext;
    const url = new URL(req.url, process.env.ROOT_URL);
    const parsedPath = path.parse(url.pathname);

    if (parsedPath.ext !== '.json') throw new Error('Invalid ERC Metadata URI');

    const { productId, localeOrTokenFilename, tokenFileName } = req.params as any;
    const locale = tokenFileName ? new Intl.Locale(localeOrTokenFilename) : systemLocale;

    const ercMetadata = await services.warehousing.ercMetadata(
      {
        productId,
        locale,
        chainTokenId: parsedPath.name,
      },
      req.unchainedContext,
    );

    if (!ercMetadata) return methodWrongHandler(res);

    const body = JSON.stringify(ercMetadata);
    res.status(200);
    res.header('Content-Length', Buffer.byteLength(body));
    res.header('Content-Type', 'text/plain');
    return res.send(body);
  } catch (e) {
    return errorHandler(res)(e);
  }
};

export default ercMetadataMiddleware;
