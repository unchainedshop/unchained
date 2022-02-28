import { useMiddlewareWithCurrentContext } from 'meteor/unchained:api';
import path from 'path';
import { log, LogLevel } from 'meteor/unchained:logger';
import sign from './sign';
import promisePipe from './promisePipe';

const { ROOT_URL } = process.env;

/*
curl -vvv -X PUT -T /Users/pozylon/Downloads/grafik.png http://localhost:3000//gridfs/afb3ae348f8b73efbb023b3c8a29d2d12f4949cbe0ffb35ca2cef2136f815fae/assortment-media/test-media?e=1646130576221&s=1384ffb4d33721b60cfaac5ee1ef977fbeff2437f2caa071d1bf9ce86cb84e29
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
