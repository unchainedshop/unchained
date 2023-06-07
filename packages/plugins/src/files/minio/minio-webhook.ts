import { log, LogLevel } from '@unchainedshop/logger';

const { MINIO_WEBHOOK_AUTH_TOKEN } = process.env;

const isAuthorized = ({ authorization = '' }) => {
  const [type, token] = authorization.split(' ');
  return type === 'Bearer' && token === MINIO_WEBHOOK_AUTH_TOKEN;
};

export const minioHandler = async (req, res) => {
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
        await services.files.linkFile({ fileId, type, size }, req.unchainedContext);
        res.writeHead(200);
        res.end();
        return;
      }
    }
    res.writeHead(404);
    res.end();
  } catch (e) {
    log(e.message, { level: LogLevel.Error });
    res.writeHead(503);
    res.end(JSON.stringify({ name: e.name, code: e.code, message: e.message }));
  }
};
