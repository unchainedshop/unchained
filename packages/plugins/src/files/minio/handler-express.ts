import { createLogger } from '@unchainedshop/logger';
import { timingSafeStringEqual } from '@unchainedshop/utils';

const logger = createLogger('unchained:minio');

const { MINIO_WEBHOOK_AUTH_TOKEN } = process.env;

const isAuthorized = async ({ authorization = '' }): Promise<boolean> => {
  if (!MINIO_WEBHOOK_AUTH_TOKEN) return false;
  const [type, token] = authorization.split(' ');
  if (type !== 'Bearer' || !token) return false;
  // Use timing-safe comparison to prevent timing attacks
  return timingSafeStringEqual(token, MINIO_WEBHOOK_AUTH_TOKEN);
};

const minioHandler = async (req, res) => {
  try {
    if (req.method === 'POST' && req.body) {
      const { headers } = req;
      const { Records = [], EventName } = req.body;
      if (EventName === 's3:ObjectCreated:Put' && (await isAuthorized(headers))) {
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
