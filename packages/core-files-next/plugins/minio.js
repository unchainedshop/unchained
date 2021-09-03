import Minio from 'minio';
import crypto from 'crypto';
import { Readable } from 'stream';
import http from 'https';
import { url } from 'inspector';
import { MediaObjects } from '../db';

const {
  MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY,
  MINIO_ENDPOINT,
  MINIO_BUCKET_NAME,
  NODE_ENV,
} = process.env;

const generateMinioUrl = (directoryName, filename) => {
  return `${MINIO_ENDPOINT}/${MINIO_BUCKET_NAME}/${directoryName}/${filename}`;
};

const composeObjectName = (object) => {
  return decodeURIComponent(object._id).concat(
    object.url.substr(object.url.lastIndexOf('.'))
  );
};

function downloadFromUrlToBuffer(url) {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line consistent-return
    const req = http.get(url, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`statusCode=${res.statusCode}`));
      }

      const body = [];
      let buf;
      res.on('data', (chunk) => {
        body.push(chunk);
      });
      res.on('end', () => {
        try {
          buf = Buffer.concat(body);
        } catch (e) {
          reject(e);
        }
        resolve(Buffer.from(buf, 'base64'));
      });
    });
    req.on('error', (err) => {
      reject(err);
    });
    req.end();
  });
}

if (!MINIO_ACCESS_KEY || !MINIO_SECRET_KEY || !MINIO_ENDPOINT) return;

const generateRandomFileName = (fileName) => {
  const random = crypto.randomBytes(16);
  const hash = crypto
    .createHash('sha256')
    .update([fileName, random].join(''))
    .digest('hex');
  const extension = fileName.substr(fileName.lastIndexOf('.'));
  const hashedName = hash + extension;
  return {
    hash,
    hashedName,
  };
};

function bufferToStream(buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  return stream;
}

const PUT_URL_EXPIRY = 24 * 60 * 60;

function connectToMinio() {
  try {
    const resolvedUrl = new URL(MINIO_ENDPOINT);
    return new Minio.Client({
      endPoint: resolvedUrl.host,
      useSSL: resolvedUrl.protocol === 'https:',
      port: resolvedUrl.port || undefined,
      accessKey: MINIO_ACCESS_KEY,
      secretKey: MINIO_SECRET_KEY,
    });
  } catch (e) {
    return null;
  }
}

const client = connectToMinio();
if (NODE_ENV === 'development') client.traceOn(process.stdout);

export const createSignedPutURL = async (
  directoryName = '',
  fileName,
  { userId, ...context }
) => {
  if (!client) throw new Error('Minio not connected, check env variables');
  const { hash, hashedName } = generateRandomFileName(fileName);

  const putURL = await client.presignedPutObject(
    MINIO_BUCKET_NAME,
    `${directoryName}/${hashedName}`,
    PUT_URL_EXPIRY
  );

  const _id = MediaObjects.insert({
    _id: encodeURIComponent(`${directoryName}/${hash}`),
    name: fileName,
    expires: PUT_URL_EXPIRY,
    created: new Date(),
  });

  return {
    _id,
    putURL,
    expires: PUT_URL_EXPIRY,
  };
};

export const removeObjects = async (ids, options = {}) => {
  const idList = [];
  if (typeof ids === 'string') {
    const object = MediaObjects.findOne({ _id: ids });
    idList.push(composeObjectName(object));
  } else if (Array.isArray(ids)) {
    ids.forEach((id) => {
      idList.push(
        ...MediaObjects.find(
          { _id: id },
          {
            fields: {
              _id: true,
              url: true,
            },
          }
        ).map((o) => composeObjectName(o))
      );
    });
  }

  const media = MediaObjects.remove({
    _id: {
      $in: idList,
    },
  });
  await client.removeObjects(MINIO_BUCKET_NAME, idList);
  return media;
};

export const uploadObjectStream = async (directoryName, rawFile, options) => {
  let stream;
  let fname;
  if (rawFile instanceof Promise) {
    const { filename, createReadStream } = await rawFile;
    fname = filename;
    stream = createReadStream();
  } else {
    fname = rawFile.filename;
    stream = bufferToStream(Buffer.from(rawFile.buffer, 'base64'));
  }

  const { hash, hashedName } = generateRandomFileName(fname);

  await client.putObject(
    MINIO_BUCKET_NAME,
    `${directoryName}/${hashedName}`,
    stream
  );

  const _id = MediaObjects.insert({
    _id: encodeURIComponent(`${directoryName}/${hash}`),
    url: generateMinioUrl(directoryName, fname),
    name: fname,
    expires: PUT_URL_EXPIRY,
    created: new Date(),
  });

  return {
    _id,
    url: generateMinioUrl(directoryName, fname),
    name: fname,
    expires: PUT_URL_EXPIRY,
    created: new Date(),
  };
};

export const uploadFileFromURL = async (
  directoryName,
  { fileLink, fileName },
  options
) => {
  const { href } = new URL(fileLink);
  const filename = fileName || href.split('/').pop();
  const { hash, hashedName } = generateRandomFileName(filename);

  const buff = await downloadFromUrlToBuffer(fileLink);
  await client.putObject(
    MINIO_BUCKET_NAME,
    `${directoryName}/${hashedName}`,
    bufferToStream(buff)
  );
  const _id = MediaObjects.insert({
    _id: encodeURIComponent(`${directoryName}/${hash}`),
    url: generateMinioUrl(directoryName, filename),
    name: filename,
    expires: PUT_URL_EXPIRY,
    created: new Date(),
  });

  return {
    _id,
    url: generateMinioUrl(directoryName, filename),
    name: filename,
    expires: PUT_URL_EXPIRY,
    created: new Date(),
  };
};

export default client;
