import https from 'https';
import http, { OutgoingHttpHeaders } from 'http';
import { Readable } from 'stream';
import { URL } from 'url';
import { UploadFileData } from '@unchainedshop/file-upload';
import {
  FileAdapter,
  FileDirector,
  buildHashedFilename,
  resolveExpirationDate,
  IFileAdapter,
} from '@unchainedshop/file-upload';

import { log, LogLevel } from '@unchainedshop/logger';
import mimeType from 'mime-types';
import { Client } from 'minio';
import { AssumeRoleProvider } from 'minio/dist/esm/AssumeRoleProvider.mjs';
import { expiryOffsetInMs } from '@unchainedshop/file-upload/lib/put-expiration.js';

const {
  MINIO_ACCESS_KEY,
  MINIO_REGION,
  MINIO_STS_ENDPOINT,
  MINIO_SECRET_KEY,
  MINIO_ENDPOINT,
  MINIO_BUCKET_NAME,
  MINIO_UPLOAD_PREFIX,
  NODE_ENV,
  AMAZON_S3_SESSION_TOKEN,
} = process.env;

let client: Client;

export async function connectToMinio() {
  if (!MINIO_ENDPOINT || !MINIO_BUCKET_NAME) {
    log(
      'Please configure Minio/S3 by providing MINIO_ENDPOINT & MINIO_BUCKET_NAME to use upload features',
      { level: LogLevel.Error },
    );
    return null;
  }

  try {
    const resolvedUrl = new URL(MINIO_ENDPOINT);
    const minioClient = new Client({
      endPoint: resolvedUrl.hostname,
      useSSL: resolvedUrl.protocol === 'https:',
      port: parseInt(resolvedUrl.port, 10) || undefined,
      region: MINIO_REGION,
      sessionToken: AMAZON_S3_SESSION_TOKEN,
      accessKey: MINIO_ACCESS_KEY,
      secretKey: MINIO_SECRET_KEY,
    });

    // eslint-disable-next-line
    // @ts-ignore
    if (NODE_ENV === 'development') minioClient?.traceOn(process.stdout);
    if (MINIO_STS_ENDPOINT) {
      const ap = new AssumeRoleProvider({
        stsEndpoint: MINIO_STS_ENDPOINT,
        accessKey: MINIO_ACCESS_KEY,
        secretKey: MINIO_SECRET_KEY,
      });
      // eslint-disable-next-line
      // @ts-ignore
      await minioClient.setCredentialsProvider(ap);
    }
    return minioClient;
  } catch (error) {
    log(`Exception while creating Minio client: ${error.message}`, {
      level: LogLevel.Error,
    });
  }
  return null;
}

const generateMinioPath = (directoryName: string, fileName: string) => {
  const prefix = MINIO_UPLOAD_PREFIX || '';
  return [prefix, directoryName, fileName].filter(Boolean).join('/');
};

const generateMinioUrl = (directoryName: string, hashedFilename: string) => {
  return `${MINIO_ENDPOINT}/${MINIO_BUCKET_NAME}/${generateMinioPath(directoryName, hashedFilename)}`;
};

connectToMinio().then(function setClient(c) {
  client = c;
});

const createHttpDownloadStream = async (
  fileUrl: string,
  headers: OutgoingHttpHeaders,
): Promise<http.IncomingMessage> => {
  const { href, protocol } = new URL(fileUrl);
  return new Promise((resolve, reject) => {
    try {
      if (protocol === 'http:') {
        http.get(href, { headers }, resolve);
      } else {
        https.get(href, { headers }, resolve);
      }
    } catch (e) {
      reject(e);
    }
  });
};

const getObjectStats = async (fileName: string) => {
  if (!client) throw new Error('Minio not connected, check env variables');

  return client.statObject(MINIO_BUCKET_NAME, fileName);
};

const bufferToStream = (buffer: any) => {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  return stream;
};

export const MinioAdapter: IFileAdapter = {
  key: 'shop.unchained.file-upload-plugin.minio',
  label: 'Uploads files into an S3 bucket using minio',
  version: '1.1.0',

  ...FileAdapter,

  async createSignedURL(directoryName, fileName, context, isPrivate) {
    if (!client) throw new Error('Minio not connected, check env variables');

    const expiryDate = resolveExpirationDate();
    const _id = buildHashedFilename(directoryName, fileName, expiryDate);

    const url = await client.presignedPutObject(
      MINIO_BUCKET_NAME,
      generateMinioPath(directoryName, _id),
      expiryOffsetInMs() / 1000,
    );

    return {
      _id,
      directoryName,
      expiryDate,
      fileName,
      type: mimeType.lookup(fileName),
      putURL: url,
      url: generateMinioUrl(directoryName, _id),
      isPrivate: Boolean(isPrivate),
    } as UploadFileData & { putURL: string; isPrivate: boolean };
  },

  async removeFiles(files) {
    if (!client) throw new Error('Minio not connected, check env variables');

    const fileIds = files.map(({ path, _id }) => {
      return `${path}/${_id}`;
    });

    await client.removeObjects(MINIO_BUCKET_NAME, fileIds);
  },

  async uploadFileFromStream(directoryName: string, rawFile: any) {
    if (!client) throw new Error('Minio not connected, check env variables');

    let stream;
    let fileName;
    if (rawFile instanceof Promise) {
      const { filename: fname, createReadStream } = await rawFile;
      fileName = fname;
      stream = createReadStream();
    } else {
      fileName = rawFile.filename;
      stream = bufferToStream(Buffer.from(rawFile.buffer, 'base64'));
    }

    const _id = buildHashedFilename(directoryName, fileName, new Date());
    const type = mimeType.lookup(fileName) || (await Promise.resolve(rawFile)).mimetype;

    const metaData = {
      'Content-Type': type,
    };

    await client.putObject(
      MINIO_BUCKET_NAME,
      generateMinioPath(directoryName, _id),
      stream,
      undefined,
      metaData,
    );

    const { size } = await getObjectStats(generateMinioPath(directoryName, _id));

    return {
      _id,
      directoryName,
      expiryDate: null,
      fileName,
      size,
      type,
      url: generateMinioUrl(directoryName, _id),
    } as UploadFileData;
  },

  async uploadFileFromURL(directoryName: string, { fileLink, fileName: fname, fileId, headers }: any) {
    if (!client) throw new Error('Minio not connected, check env variables');

    const { href } = new URL(fileLink);
    const fileName = fname || href.split('/').pop();
    const hashedFilename = buildHashedFilename(directoryName, fileName, new Date());

    const stream = await createHttpDownloadStream(fileLink, headers);
    const type = mimeType.lookup(fileName) || stream.headers['content-type'];

    const metaData = {
      'Content-Type': type,
    };

    await client.putObject(
      MINIO_BUCKET_NAME,
      generateMinioPath(directoryName, hashedFilename),
      stream,
      undefined,
      metaData,
    );
    const { size } = await getObjectStats(generateMinioPath(directoryName, hashedFilename));

    return {
      _id: fileId || hashedFilename,
      directoryName,
      expiryDate: null,
      fileName,
      size,
      type,
      url: generateMinioUrl(directoryName, hashedFilename),
    } as UploadFileData;
  },

  async createDownloadStream(file) {
    if (!client) throw new Error('Minio not connected, check env variables');

    const stream = await client.getObject(MINIO_BUCKET_NAME, generateMinioPath(file.path, file._id));
    return stream;
  },
};

FileDirector.registerAdapter(MinioAdapter);

export default MinioAdapter;
