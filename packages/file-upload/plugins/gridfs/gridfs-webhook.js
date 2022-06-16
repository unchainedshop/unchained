import { useMiddlewareWithCurrentContext } from 'meteor/unchained:api';
import { log, LogLevel } from '@unchainedshop/logger';
import sign from './sign';
import promisePipe from './promisePipe';
import buildHashedFilename from '../../src/buildHashedFilename';

const { ROOT_URL } = process.env;

/*
curl -vvv -X PUT -T /Users/pozylon/Downloads/grafik.png http://localhost:4010/gridfs/user-avatars/hans.png?e=1653059591506&s=df8626a1c9b9006249d7f1928fd530579fed57216f1bdcb83c28a8322cdc90b1
*/

useMiddlewareWithCurrentContext('/gridfs', async (req, res) => {
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
        }
        const writeStream = await modules.gridfsFileUploads.createWriteStream(
          directoryName,
          fileId,
          fileName,
        );
        const { length } = await promisePipe(req, writeStream);
        await services.files.linkFile({ fileId, size: length }, req.unchainedContext);
        res.writeHead(200);
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
      await promisePipe(readStream, res);
      res.writeHead(200);
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
