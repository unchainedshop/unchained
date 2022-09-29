import { useMiddlewareWithCurrentContext } from '@unchainedshop/api';
import { log, LogLevel } from '@unchainedshop/logger';
import bodyParser from 'body-parser';

const { MINIO_WEBHOOK_AUTH_TOKEN } = process.env;

const isAuthorized = ({ authorization = '' }) => {
  const [type, token] = authorization.split(' ');
  return type === 'Bearer' && token === MINIO_WEBHOOK_AUTH_TOKEN;
};

export default (app) => {
  useMiddlewareWithCurrentContext(
    app,
    '/minio/',
    bodyParser.json({
      strict: false,
    }),
  );

  useMiddlewareWithCurrentContext(app, '/minio/', async (req, res) => {
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
      return;
    } catch (e) {
      log(e.message, { level: LogLevel.Error });
      res.writeHead(503);
      res.end(JSON.stringify({ name: e.name, code: e.code, message: e.message }));
    }
  });
};

/*

curl -X PUT -T /Users/pozylon/Desktop/Bildschirmfoto\ 2022-02-17\ um\ 16.47.22.png  http://localhost:4010/gridfs/3e0cd78ac07f0028890ce36c391057dd0c5fb46f4c147fb73e54bd8a7ffee389/user-avatars/avatar.png?e=1645883865878&s=e7466b30039593e5790e23cab92878e0144289c3710344a55b78c9a916e2f78c
curl -X PUT -T /Users/pozylon/Desktop/Bildschirmfoto\ 2022-02-17\ um\ 16.47.22.png  https://minio.dev.shared.ucc.dev/unchained-test-bucket/user-avatars/9aedd551499b2850e9483b07cd4c8cff7ad1d710f49933c183861bf40183bc5a?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=unchained-test%2F20220225%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20220225T140957Z&X-Amz-Expires=86400&X-Amz-SignedHeaders=host&X-Amz-Signature=22807026db1210370170cd5cf49bfbb9e86010425c9d1834a56e049faf39b368

*/
