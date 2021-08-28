import Minio from 'minio';
import crypto from 'crypto';
import { Readable } from 'stream';
import http from 'https';
import { MediaObjects } from '../db';

const {
  MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY,
  MINIO_ENDPOINT,
  MINIO_PORT,
  MINIO_BUCKET_NAME,
  NODE_ENV,
} = process.env;

const protocol = NODE_ENV === 'production' ? 'https://' : 'http://';

const generateMinioUrl = (directoryName, filename) => {
  return `${protocol}${MINIO_ENDPOINT}:${MINIO_PORT}/${MINIO_BUCKET_NAME}/${directoryName}/${filename}`;
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

if ((!MINIO_ACCESS_KEY || !MINIO_SECRET_KEY || !MINIO_ENDPOINT, !MINIO_PORT))
  return;

const generateRandomeFileName = (fileName) => {
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

const client = new Minio.Client({
  endPoint: MINIO_ENDPOINT,
  port: parseInt(MINIO_PORT, 10),
  useSSL: false,
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY,
});

if (!client.bucketExists(MINIO_BUCKET_NAME)) {
  client.makeBucket(MINIO_BUCKET_NAME);
}

export const createSignedPutURL = async (
  directoryName = '',
  fileName,
  { userId, ...context }
) => {
  if (!client)
    throw new Error('Required minio environment variables not defined');
  const { hash, hashedName } = generateRandomeFileName(fileName);

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

export const removeObject = async (id, options = {}) => {
  const object = MediaObjects.findOne({ _id: id });
  const media = MediaObjects.remove({ _id: id });
  await client.removeObject(
    MINIO_BUCKET_NAME,
    decodeURIComponent(id).concat(
      object.url.substr(object.url.lastIndexOf('.'))
    )
  );
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

  const { hash, hashedName } = generateRandomeFileName(fname);

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
  const { hash, hashedName } = generateRandomeFileName(filename);

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
