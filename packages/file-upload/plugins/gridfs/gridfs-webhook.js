import { useMiddlewareWithCurrentContext } from 'meteor/unchained:api';
import path from 'path';
import { log, LogLevel } from 'meteor/unchained:logger';
import sign from './sign';
import promisePipe from './promisePipe';

const { ROOT_URL } = process.env;

/*
curl -X PUT -T /Users/pozylon/Downloads/grafik.png http://localhost:4010/gridfs/upload/user-avatars/1bfade8a16934ba39720c4b931e1462dc0af4f4f0409a0d441d1fff89102f5a1?e=1645732641282&s=9ec4e1a450db3e3d7e833475b2f6882ba7fd4c1265fe3e574bfc609666565458
*/

useMiddlewareWithCurrentContext('/gridfs', async (req, res) => {
  try {
    const { services, modules } = req.unchainedContext;
    const url = new URL(req.url, ROOT_URL);
    const { dir } = path.parse(url.pathname);
    const [, fileId, directoryName] = dir.split('/');

    if (req.method === 'PUT') {
      const { s: signature, e: expiryTimestamp } = req.query;
      if (sign(directoryName, fileId, expiryTimestamp) === signature) {
        const file = await modules.files.findFile({ fileId });
        if (file.expires === null) {
          res.writeHead(503);
          res.end('File already linked');
        }
        const writeStream = await modules.gridfsFileUploads.createWriteStream(
          directoryName,
          fileId,
          file.name,
        );
        const { length } = await promisePipe(req, writeStream);
        const link = await services.files.linkFile({ fileId, size: length }, req.unchainedContext);
        res.writeHead(200);
        res.end(link);
        return;
      }
      res.writeHead(403);
      res.end();
      return;
    }
    if (req.method === 'GET') {
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
