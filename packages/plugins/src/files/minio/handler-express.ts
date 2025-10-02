import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:minio');

const { MINIO_WEBHOOK_AUTH_TOKEN } = process.env;

const isAuthorized = ({ authorization = '' }) => {
  const [type, token] = authorization.split(' ');
  return type === 'Bearer' && token === MINIO_WEBHOOK_AUTH_TOKEN;
};

const minioHandler = async (req, res) => {
  try {
    if (req.method === 'POST' && req.body) {
      const { headers } = req;
      const { Records = [], EventName } = req.body;
      if (EventName === 's3:ObjectCreated:Put' && isAuthorized(headers)) {
        const [{ s3 }] = Records;
        const { object } = s3;
        const { size, contentType: type } = object;
        const [fileId] = object.key.split('.');
        const { services } = req.unchainedContext;
        await services.files.linkFile({ fileId, type, size });
        res.status(200).end();
        return;
      }
    }
    res.status(404).end();
  } catch (e) {
    logger.error(e);
    res.status(503).send({ name: e.name, code: e.code, message: e.message });
  }
};

export default minioHandler;
