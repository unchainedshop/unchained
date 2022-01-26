import { useMiddlewareWithCurrentContext } from 'meteor/unchained:api';
import bodyParser from 'body-parser';

const { MINIO_WEBHOOK_AUTH_TOKEN } = process.env;

const isAuthorized = ({ authorization = '' }) => {
  const [type, token] = authorization.split(' ');
  return type === 'Bearer' && token === MINIO_WEBHOOK_AUTH_TOKEN;
};

useMiddlewareWithCurrentContext(
  '/minio/',
  bodyParser.json({
    strict: false,
  })
);

useMiddlewareWithCurrentContext('/minio/', async (req) => {
  if (req.method === 'POST' && req.body) {
    const { headers } = req;
    const { Records = [], EventName } = req.body;
    if (EventName === 's3:ObjectCreated:Put' && isAuthorized(headers)) {
      const [{ s3 }] = Records;
      const { object } = s3;
      const { size, contentType: type } = object;
      const [currentId] = object.key.split('.');
      const { services } = req.unchainedContext;
      services.files.linkFile(
        { externalId: currentId, type, size },
        req.unchainedContext
      );
    }
  }
});
