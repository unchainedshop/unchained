import { Readable } from 'node:stream';
import type { ReadableStream } from 'node:stream/web';
import { type UploadFileData } from '@unchainedshop/file-upload';
import {
  FileAdapter,
  FileDirector,
  buildHashedFilename,
  resolveExpirationDate,
  type IFileAdapter,
} from '@unchainedshop/file-upload';
import mime from 'mime/lite';
import { Client } from 'minio';
import { AssumeRoleProvider } from 'minio/dist/esm/AssumeRoleProvider.mjs';
import { expiryOffsetInMs } from '@unchainedshop/file-upload/lib/put-expiration.js';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:minio');

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

let client: Client | null = null;

export async function connectToMinio() {
  if (!MINIO_ENDPOINT || !MINIO_BUCKET_NAME) {
    logger.error(
      'Please configure Minio/S3 by providing MINIO_ENDPOINT & MINIO_BUCKET_NAME to use upload features',
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
        accessKey: MINIO_ACCESS_KEY!,
        secretKey: MINIO_SECRET_KEY!,
      });
      // eslint-disable-next-line
      // @ts-ignore
      await minioClient.setCredentialsProvider(ap);
    }
    return minioClient;
  } catch (error) {
    logger.error(`Exception while creating Minio client: ${error.message}`);
  }
  return null;
}

const generateMinioPath = (directoryName: string, fileName: string) => {
  const prefix = MINIO_UPLOAD_PREFIX || '';
  return [prefix, directoryName, fileName].filter(Boolean).join('/');
};

const generateMinioUrl = (directoryName: string, hashedFilename: string) => {
  return `${MINIO_ENDPOINT}/${MINIO_BUCKET_NAME!}/${generateMinioPath(directoryName, hashedFilename)}`;
};

connectToMinio().then(function setClient(c) {
  client = c || client;
});

const getObjectStats = async (fileName: string) => {
  if (!client) throw new Error('Minio not connected, check env variables');

  return client.statObject(MINIO_BUCKET_NAME!, fileName);
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

  async createDownloadURL(file) {
    if (file.meta?.isPrivate) throw new Error("Minio Plugin doesn't support private files yet");
    return generateMinioUrl(file.path, file._id);
  },

  async createSignedURL(directoryName, fileName) {
    if (!client) throw new Error('Minio not connected, check env variables');

    const expiryDate = resolveExpirationDate();
    const _id = await buildHashedFilename(directoryName, fileName, expiryDate);

    const url = await client.presignedPutObject(
      MINIO_BUCKET_NAME!,
      generateMinioPath(directoryName, _id),
      expiryOffsetInMs() / 1000,
    );

    return {
      _id,
      directoryName,
      expiryDate,
      fileName,
      type: mime.getType(fileName),
      putURL: url,
      url: generateMinioUrl(directoryName, _id),
    } as UploadFileData & { putURL: string };
  },

  async removeFiles(files) {
    if (!client) throw new Error('Minio not connected, check env variables');

    const fileIds = files.map(({ path, _id }) => {
      return `${path}/${_id}`;
    });

    await client.removeObjects(MINIO_BUCKET_NAME!, fileIds);
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

    const _id = await buildHashedFilename(directoryName, fileName, new Date());
    const type = mime.getType(fileName) || (await Promise.resolve(rawFile)).mimetype;

    const metaData = {
      'Content-Type': type,
    };

    await client.putObject(
      MINIO_BUCKET_NAME!,
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

    // URL is pre-validated at service level (uploadFileFromURLService)
    const url = new URL(fileLink);
    const fileName = fname || url.href.split('/').pop();
    const hashedFilename = await buildHashedFilename(directoryName, fileName, new Date());

    const response = await fetch(url, { headers });
    const type = mime.getType(fileName) || response.headers['content-type'];
    const readable = Readable.fromWeb(response.body as ReadableStream<Uint8Array<ArrayBufferLike>>);
    const metaData = {
      'Content-Type': type,
    };

    await client.putObject(
      MINIO_BUCKET_NAME!,
      generateMinioPath(directoryName, hashedFilename),
      readable,
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

    const stream = await client.getObject(MINIO_BUCKET_NAME!, generateMinioPath(file.path, file._id));
    return stream;
  },
};

FileDirector.registerAdapter(MinioAdapter);

export default MinioAdapter;
