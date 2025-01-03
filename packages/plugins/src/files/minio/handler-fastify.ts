import { Context } from '@unchainedshop/api';
import { createLogger } from '@unchainedshop/logger';
import { FastifyRequest, RouteHandlerMethod } from 'fastify';

const logger = createLogger('unchained:plugins:minio');

const { MINIO_WEBHOOK_AUTH_TOKEN } = process.env;

const isAuthorized = ({ authorization = '' }) => {
  const [type, token] = authorization.split(' ');
  return type === 'Bearer' && token === MINIO_WEBHOOK_AUTH_TOKEN;
};

const minioHandler: RouteHandlerMethod = async (
  req: FastifyRequest & {
    unchainedContext: Context;
  },
  res,
) => {
  try {
    if (req.body) {
      const { headers } = req;
      const { Records = [], EventName } = req.body as Record<string, any>;
      if (EventName === 's3:ObjectCreated:Put' && isAuthorized(headers)) {
        const [{ s3 }] = Records;
        const { object } = s3;
        const { size, contentType: type } = object;
        const [fileId] = object.key.split('.');
        const { services } = req.unchainedContext;
        await services.files.linkFile({ fileId, type, size });
        res.status(200);
        return res.send();
      }
    }
    res.status(404);
    return res.send();
  } catch (e) {
    logger.error(e);
    res.status(503);
    return res.send(JSON.stringify({ name: e.name, code: e.code, message: e.message }));
  }
};

export default minioHandler;
