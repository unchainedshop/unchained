import { log, LogLevel } from '@unchainedshop/logger';
import { buildHashedFilename } from '@unchainedshop/file-upload';
import { pipeline as rawPipeline } from 'stream';
import { promisify } from 'util';
import sign from './sign.js';

const pipeline = promisify(rawPipeline);

const { ROOT_URL } = process.env;

export const gridfsHandler = async (req, res) => {
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
        await pipeline(req, writeStream);
        const { length } = writeStream;
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
      await pipeline(readStream, res);
      res.end();
      return;
    }
    res.writeHead(404);
    res.end();
    return;
  } catch (e) {
    log(e.message, { level: LogLevel.Error });
    res.writeHead(503);
    res.end(JSON.stringify({ name: e.name, code: e.code, message: e.message }));
  }
};
