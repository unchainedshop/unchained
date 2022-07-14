import { useMiddlewareWithCurrentContext } from '@unchainedshop/api';
import { log, LogLevel } from '@unchainedshop/logger';
import { buildHashedFilename } from '@unchainedshop/file-upload';
import sign from './sign';
import promisePipe from './promisePipe';

const { ROOT_URL } = process.env;

/*
curl -vvv -X PUT -T /Users/pozylon/Downloads/grafik.png http://localhost:4010/gridfs/user-avatars/hans.png?e=1653059591506&s=df8626a1c9b9006249d7f1928fd530579fed57216f1bdcb83c28a8322cdc90b1
*/

export default (app) =>
  useMiddlewareWithCurrentContext(app, '/gridfs', async (req, res) => {
    try {
      const { services, modules } = req.unchainedContext;
      const url = new URL(req.url, ROOT_URL);
      const [, directoryName, fileName] = url.pathname.split('/');

      if (req.method === 'PUT') {
        const { s: signature, e: expiryTimestamp } = req.query;
        const expiryDate = new Date(parseInt(expiryTimestamp, 10));
        const fileId = buildHashedFilename(directoryName, fileName, expiryDate);
        if (sign(directoryName, fileId, expiryDate.getTime()) === signature) {
          const file = await modules.files.findFile({ fileId });
          if (file.expires === null) {
            res.writeHead(503);
            res.end('File already linked');
            return;
          }
          const writeStream = await modules.gridfsFileUploads.createWriteStream(
            directoryName,
            fileId,
            fileName,
          );
          res.writeHead(200);
          const { length } = await promisePipe(req, writeStream);
          await services.files.linkFile({ fileId, size: length }, req.unchainedContext);
          res.end();
          return;
        }
        res.writeHead(403);
        res.end();
        return;
      }
      if (req.method === 'GET') {
        const fileId = fileName;
        const readStream = await modules.gridfsFileUploads.createReadStream(directoryName, fileId);
        res.writeHead(200);
        await promisePipe(readStream, res);
        res.end();
        return;
      }
      res.writeHead(404);
      res.end();
      return;
    } catch (e) {
      log(e.message, { level: LogLevel.Error });
      res.writeHead(503);
      res.end(JSON.stringify(e));
    }
  });
