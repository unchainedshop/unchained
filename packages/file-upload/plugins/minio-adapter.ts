import { File, FileAdapter } from '@unchainedshop/types/files';
import { setFileUploadAdapter } from 'meteor/unchained:file-upload';
import crypto from 'crypto';
import https from 'https';
import { log, LogLevel } from 'meteor/unchained:logger';
import mimeType from 'mime-types';
import Minio from 'minio';
import { Readable } from 'stream';
import { URL } from 'url';

const {
  MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY,
  MINIO_ENDPOINT,
  MINIO_BUCKET_NAME,
  NODE_ENV,
} = process.env;
const PUT_URL_EXPIRY = 24 * 60 * 60;

const connectToMinio = () => {
  if (!MINIO_ACCESS_KEY || !MINIO_SECRET_KEY || !MINIO_ENDPOINT) {
    log(
      'Please configure Minio/S3 by providing MINIO_ACCESS_KEY,MINIO_SECRET_KEY & MINIO_ENDPOINT to use upload features',
      { level: LogLevel.Error }
    );
    return null;
  }

  try {
    const resolvedUrl = new URL(MINIO_ENDPOINT);
    return new Minio.Client({
      endPoint: resolvedUrl.hostname,
      useSSL: resolvedUrl.protocol === 'https:',
      port: parseInt(resolvedUrl.port, 10) || undefined,
      accessKey: MINIO_ACCESS_KEY,
      secretKey: MINIO_SECRET_KEY,
    });
  } catch (e) {
    console.error(e);
    return null;
  }
};

const generateMinioUrl = (directoryName: string, hashedFilename: string) => {
  return `${MINIO_ENDPOINT}/${MINIO_BUCKET_NAME}/${directoryName}/${hashedFilename}`;
};

const getMimeType = (extension) => {
  return mimeType.lookup(extension);
};

const client: Minio.Client = connectToMinio();
/* @ts-ignore */
if (NODE_ENV === 'development') client?.traceOn(process.stdout);

const downloadFromUrlToBuffer = async (fileUrl: string) => {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line consistent-return
    const req = https.get(fileUrl, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`statusCode=${res.statusCode}`));
      }

      const body: any = [];
      let buffer;
      res.on('data', (chunk) => {
        body.push(chunk);
      });
      res.on('end', () => {
        try {
          buffer = Buffer.concat(body);
        } catch (e) {
          reject(e);
        }
        resolve(Buffer.from(buffer, 'base64'));
      });
    });
    req.on('error', (err) => {
      reject(err);
    });
    req.end();
  });
};

const generateRandomFileName = (fileName: string) => {
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

const getObjectStats = async (fileName: string) => {
  if (!client) throw new Error('Minio not connected, check env variables');

  return await client.statObject(MINIO_BUCKET_NAME, fileName);
};

const bufferToStream = (buffer: any) => {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  return stream;
};

const getExpiryDate = () => new Date(new Date().getTime() + PUT_URL_EXPIRY);

export const MinioAdapter: FileAdapter = {
  // Returns the file name with extension from its ID and url bucket name is included in the ID on insert operation
  composeFileName: (file: File) => {
    return decodeURIComponent(file.externalId).concat(
      file.url ? file.url.substr(file.url.lastIndexOf('.')) : ''
    );
  },

  createSignedURL: async (directoryName = '', fileName) => {
    if (!client) throw new Error('Minio not connected, check env variables');

    const { hash, hashedName } = generateRandomFileName(fileName);

    const url = await client.presignedPutObject(
      MINIO_BUCKET_NAME,
      `${directoryName}/${hashedName}`,
      PUT_URL_EXPIRY
    );

    return {
      directoryName,
      expiryDate: getExpiryDate(),
      fileName,
      hash,
      hashedName,
      type: getMimeType(fileName),
      url,
    };
  },

    async removeFiles(composedFileIds) {
    if (!client) throw new Error('Minio not connected, check env variables');

    await client.removeObjects(MINIO_BUCKET_NAME, composedFileIds);
  },

  async uploadFileFromStream(directoryName: string, rawFile: any) {
    if (!client) throw new Error('Minio not connected, check env variables');

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

    const { size } = await getObjectStats(`${directoryName}/${hashedName}`);
    const type = getMimeType(fname);

    return {
      directoryName,
      expiryDate: getExpiryDate(),
      fileName: fname,
      hash,
      hashedName,
      size,
      type,
      url: generateMinioUrl(directoryName, hashedName),
    };
  },

  async uploadFileFromURL(directoryName, { fileLink, fileName }) {
    if (!client) throw new Error('Minio not connected, check env variables');

    const { href } = new URL(fileLink);
    const filename = fileName || href.split('/').pop();
    const { hash, hashedName } = generateRandomFileName(filename);

    const buff = await downloadFromUrlToBuffer(fileLink);
    const stream = bufferToStream(buff);
    await client.putObject(
      MINIO_BUCKET_NAME,
      `${directoryName}/${hashedName}`,
      stream
    );
    const { size } = await getObjectStats(`${directoryName}/${hashedName}`);
    const type = getMimeType(filename);

    return {
      directoryName,
      expiryDate: getExpiryDate(),
      fileName: filename,
      hash,
      hashedName,
      size,
      type,
      url: generateMinioUrl(directoryName, hashedName),
    };
  },
};

setFileUploadAdapter(MinioAdapter);