import { createLogger } from '@unchainedshop/logger';
import { Context } from '../context.js';
import { FastifyRequest, RouteHandlerMethod } from 'fastify';

const logger = createLogger('unchained:erc-metadata');

const errorHandler = (res) => (e) => {
  logger.error(e.message);
  res.status(503);
  return res.send(JSON.stringify({ name: e.name, code: e.code, message: e.message }));
};

const notFoundHandler = (res) => {
  logger.error('Method not supported, return 404');
  res.status(404);
  return res.send();
};

const ercMetadataHandler: RouteHandlerMethod = async (
  req: FastifyRequest & { unchainedContext: Context },
  res,
) => {
  try {
    const { services, localeContext } = req.unchainedContext;
    const url = new URL(req.url, process.env.ROOT_URL);

    if (!url.pathname.toLowerCase().endsWith('.json')) throw new Error('Invalid ERC Metadata URI');

    const { productId, localeOrTokenFilename, tokenFileName } = req.params as any;
    const locale = tokenFileName ? new Intl.Locale(localeOrTokenFilename) : localeContext;

    const ercMetadata = await services.warehousing.ercMetadata(
      {
        productId,
        locale,
        chainTokenId: (tokenFileName || localeOrTokenFilename).toLowerCase().replace('.json', ''),
      },
      req.unchainedContext,
    );

    if (!ercMetadata) return notFoundHandler(res);

    const body = JSON.stringify(ercMetadata);
    res.status(200);
    res.header('Content-Length', Buffer.byteLength(body));
    res.header('Content-Type', 'application/json');
    return res.send(body);
  } catch (e) {
    return errorHandler(res)(e);
  }
};

export default ercMetadataHandler;
