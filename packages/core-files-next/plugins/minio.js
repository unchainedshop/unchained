import Minio from 'minio';
import crypto from 'crypto';
import { Readable } from 'stream';
import https from 'https';
import mimeType from 'mime-types';
import { MediaObjects } from '../db';

const {
  MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY,
  MINIO_ENDPOINT,
  MINIO_BUCKET_NAME,
  NODE_ENV,
} = process.env;
const PUT_URL_EXPIRY = 24 * 60 * 60;
const mediaContainerRegistry = {};

const generateMinioUrl = (directoryName, hashedFilename) => {
  return `${MINIO_ENDPOINT}/${MINIO_BUCKET_NAME}/${directoryName}/${hashedFilename}`;
};

// Returns the file name with extension from its ID and url bucket name is included in the ID on insert operation
const composeObjectName = (object) => {
  return decodeURIComponent(object._id).concat(
    object.url.substr(object.url.lastIndexOf('.'))
  );
};

const insertMedia = ({
  directoryName,
  hash,
  hashedName,
  fileName,
  size,
  type,
  expiryDate,
  created = new Date(),
  mediaId,
  ...meta
}) => {
  const options = {
    _id: encodeURIComponent(`${directoryName}/${hash}`),
    url: generateMinioUrl(directoryName, hashedName),
    name: fileName,
    size,
    type,
    meta: { mediaId, ...meta },
    expires: expiryDate || new Date(new Date().getTime() + PUT_URL_EXPIRY),
    created,
  };

  MediaObjects.insert(options);

  return options;
};

const getMimeType = (extension) => {
  return mimeType.lookup(extension);
};
function downloadFromUrlToBuffer(fileUrl) {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line consistent-return
    const req = https.get(fileUrl, (res) => {
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

function connectToMinio() {
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
}

const client = connectToMinio();
if (NODE_ENV === 'development') client.traceOn(process.stdout);

const getObjectStats = async (fileName) => {
  return client.statObject(MINIO_BUCKET_NAME, fileName);
};

export const createSignedPutURL = async (
  directoryName = '',
  linkedMediaId,
  fileName,
  context = {}
) => {
  if (!client) throw new Error('Minio not connected, check env variables');

  const { hash, hashedName } = generateRandomFileName(fileName);

  const putURL = await client.presignedPutObject(
    MINIO_BUCKET_NAME,
    `${directoryName}/${hashedName}`,
    PUT_URL_EXPIRY
  );
  const { _id, expires } = insertMedia({
    directoryName,
    hashedName,
    hash,
    fileName,
    type: getMimeType(fileName),
    mediaId: linkedMediaId,
    ...context,
  });

  return {
    _id,
    putURL,
    expires,
  };
};

export const removeObjects = async (ids, options = {}) => {
  if (typeof ids !== 'string' && !Array.isArray(ids))
    throw Error('Media id/s to be removed not provided as a string or array');
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
      $in: typeof ids === 'string' ? [ids] : [...ids],
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

  const { size } = await getObjectStats(`${directoryName}/${hashedName}`);
  const type = getMimeType(fname);

  return insertMedia({
    directoryName,
    hashedName,
    hash,
    size,
    type,
    fileName: fname,
  });
};

export const uploadFileFromURL = async (
  directoryName,
  { fileLink, fileName },
  options = {}
) => {
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

  return insertMedia({
    directoryName,
    hashedName,
    hash,
    fileName: filename,
    size,
    type,
  });
};

export const linkMedia = async ({ mediaUploadTicketId, size, type }) => {
  const media = MediaObjects.findOne({ _id: mediaUploadTicketId });
  if (!media) throw new Error(`Media with id ${mediaUploadTicketId} Not found`);
  const { meta } = media;
  if (!meta?.mediaId) throw new Error('Linked media Id not found');
  const [mediaType] = decodeURIComponent(mediaUploadTicketId).split('/');

  MediaObjects.update(
    { _id: mediaUploadTicketId },
    {
      $set: {
        size,
        type,
        expires: null,
        updated: new Date(),
      },
    }
  );

  await mediaContainerRegistry[mediaType](mediaUploadTicketId, meta?.mediaId, {
    ...meta,
  });

  return MediaObjects.findOne({ _id: mediaUploadTicketId });
};

export default client;

export const createUploadContainer = (directoryName, fn) => {
  if (!mediaContainerRegistry[directoryName])
    mediaContainerRegistry[directoryName] = fn;

  return {
    createSignedURL: async (
      linkedMediaId,
      mediaName,
      { ...options },
      { userId, ...context }
    ) => {
      const result = await createSignedPutURL(
        directoryName,
        linkedMediaId,
        mediaName,
        {
          userId,
          ...options,
        }
      );
      return result;
    },
  };
};
