import { Readable, PassThrough } from 'node:stream';
import { finished, pipeline } from 'node:stream/promises';
import { buildHashedFilename } from '@unchainedshop/core-files';
import sign from './sign.ts';
import { getFileAdapter, type UnchainedCore } from '@unchainedshop/core';
import type { GridFSFileUploadsModule } from './module.ts';
import { createLogger } from '@unchainedshop/logger';
import { timingSafeStringEqual } from '@unchainedshop/utils';

const { GRIDFS_PUT_SERVER_PATH = '/gridfs' } = process.env;

const logger = createLogger('unchained:gridfs');

export const gridfsRouteHandler = async (
  request: Request,
  context: UnchainedCore & {
    params: Record<string, string>;
    modules: GridFSFileUploadsModule;
    rawRequest?: any; // Raw Node.js IncomingMessage
  },
) => {
  try {
    const { services, modules, params } = context;
    const directoryName = decodeURIComponent(params.directoryName);
    const fileName = decodeURIComponent(params.fileName);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Origin': '*',
    };

    // Handle OPTIONS (CORS preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Handle PUT (file upload)
    if (request.method === 'PUT') {
      const url = new URL(request.url);
      const signature = url.searchParams.get('s');
      const expiryTimestamp = url.searchParams.get('e');

      if (!signature || !expiryTimestamp) {
        return new Response(JSON.stringify({ error: 'Missing signature or expiry' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const expiryDate = new Date(parseInt(expiryTimestamp, 10));
      const fileId = await buildHashedFilename(directoryName, fileName, expiryDate);
      const expectedSignature = await sign(directoryName, fileId, expiryDate.getTime());

      // Use timing-safe comparison to prevent signature timing attacks
      if (!(await timingSafeStringEqual(expectedSignature, signature))) {
        logger.error('Invalid signature', { fileId, expiryDate });
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const file = await modules.files.findFile({ fileId });

      if (!file) {
        logger.error('File not found', { fileId });
        return new Response(JSON.stringify({ error: 'File not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      if (file.expires === null) {
        logger.error('File already linked', { fileId });
        return new Response(JSON.stringify({ error: 'File already linked' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Determine content type
      const contentType = request.headers.get('Content-Type');
      const type =
        contentType === 'application/octet-stream' ? file.type || contentType : contentType || file.type;

      const writeStream = await modules.gridfsFileUploads.createWriteStream(
        directoryName,
        fileId,
        fileName,
        {
          chunkSizeBytes: 1024 * 1024, // 1MB
          metadata: { 'content-type': type },
        },
      );

      // Use WHATWG Request body as stream
      // The ponyfill ReadableStream from @whatwg-node/server can be piped directly
      const bodyStream = request.body;

      if (!bodyStream) {
        throw new Error('No request body');
      }

      // Pipeline works with ponyfill streams
      await pipeline(
        bodyStream as any,
        new PassThrough({ highWaterMark: 1024 * 1024 * 4 }), // 4MB Buffer
        writeStream,
      );

      await finished(writeStream, { readable: false });

      const { length } = writeStream;
      await services.files.linkFile({ fileId, size: length, type });

      return new Response(
        JSON.stringify({
          success: true,
          fileId,
          size: length,
          type,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        },
      );
    }

    // Handle GET (file download)
    if (request.method === 'GET') {
      const url = new URL(request.url);
      const signature = url.searchParams.get('s');
      const expiryTimestamp = url.searchParams.get('e');

      const fileDocument = await modules.files.findFile({
        url: `${GRIDFS_PUT_SERVER_PATH}/${directoryName}/${fileName}`,
      });

      if (!fileDocument) {
        logger.error('File not found', { fileName });
        return new Response(null, {
          status: 404,
          headers: corsHeaders,
        });
      }

      // Validate signature for private files
      if (fileDocument?.meta?.isPrivate) {
        if (!expiryTimestamp || !signature) {
          return new Response(JSON.stringify({ error: 'Missing signature or expiry' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        const expiry = parseInt(expiryTimestamp, 10);
        if (expiry <= Date.now()) {
          logger.error('URL Expired', { fileName, expiry });
          return new Response(JSON.stringify({ error: 'Access restricted: Expired.' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        const fileUploadAdapter = getFileAdapter();
        const signedUrl = await fileUploadAdapter.createDownloadURL(fileDocument, expiry);
        const expectedSignature = signedUrl ? new URL(signedUrl, 'file://').searchParams.get('s') : null;

        // Use timing-safe comparison to prevent signature timing attacks
        if (
          !signedUrl ||
          !expectedSignature ||
          !(await timingSafeStringEqual(expectedSignature, signature))
        ) {
          logger.error('Invalid signature', { fileName, expiry });
          return new Response(JSON.stringify({ error: 'Access restricted: Invalid signature.' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
      }

      const file = await modules.gridfsFileUploads.getFileInfo(directoryName, fileDocument._id);
      const readStream = await modules.gridfsFileUploads.createReadStream(
        directoryName,
        fileDocument._id,
      );

      // Convert Node.js Readable to WHATWG ReadableStream
      const webStream = Readable.toWeb(readStream) as ReadableStream;

      const headers: Record<string, string> = {
        ...corsHeaders,
      };

      if (file?.metadata?.['content-type']) {
        headers['Content-Type'] = file.metadata['content-type'];
      }
      if (file?.length) {
        headers['Content-Length'] = file.length.toString();
      }

      return new Response(webStream, {
        status: 200,
        headers,
      });
    }

    return new Response(null, {
      status: 404,
      headers: corsHeaders,
    });
  } catch (e: any) {
    logger.error(e);

    if (e.code === 'ENOENT') {
      return new Response(null, { status: 404 });
    }

    return new Response(
      JSON.stringify({
        error: e.message || 'Internal Server Error',
        name: e.name,
        code: e.code,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};
