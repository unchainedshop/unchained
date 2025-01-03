import { createLogger } from '@unchainedshop/logger';
import { TicketingAPI } from '../types.js';
import { getFileAdapter } from '@unchainedshop/core-files';
import type { FastifyRequest, RouteHandlerMethod } from 'fastify';

const logger = createLogger('unchained:apple-wallet-webservice');

const isAuthenticationTokenCorrect = (req, authenticationToken) => {
  const expectedAuthorizationValue = `ApplePass ${authenticationToken}`;
  return req.headers.authorization === expectedAuthorizationValue;
};

const appleWalletHandler: RouteHandlerMethod = async (
  req: FastifyRequest & {
    unchainedContext: TicketingAPI;
  },
  reply,
) => {
  const resolvedContext = req.unchainedContext;
  const { modules } = resolvedContext;

  const path = req.url;

  logger.info(`${path} (${JSON.stringify(req.query)})`);

  if (path.startsWith('/download/')) {
    try {
      const [, , passFileName] = path.split('/');
      const [tokenId] = passFileName.split('.pkpass');

      if (!tokenId) {
        reply.status(404);
        return reply.send();
      }

      const token = await modules.warehousing.findToken({
        tokenId,
      });

      if (!token) {
        reply.status(404);
        return reply.send('Token not found');
      }

      const { hash } = req.query as Record<string, string>;
      const correctHash = await modules.warehousing.buildAccessKeyForToken(tokenId);
      if (hash !== correctHash) {
        reply.status(403);
        return reply.send('Token hash invalid for current owner');
      }

      const passFile = await modules.passes.upsertAppleWalletPass(token, resolvedContext);

      const fileUploadAdapter = getFileAdapter();
      const signedUrl = await fileUploadAdapter.createDownloadURL(passFile);
      const url = signedUrl && (await modules.files.normalizeUrl(signedUrl, {}));

      const response = await fetch(url);
      const data = await response.arrayBuffer();
      const uint8View = new Uint8Array(data);

      reply.status(200);
      reply.header('content-type', 'application/vnd.apple.pkpass');
      reply.header('Content-Disposition', `attachment; filename=${tokenId}.pkpass`);
      return reply.send(uint8View);
    } catch (e) {
      console.error(e);
    }
    reply.status(500);
    return reply.send();
  }

  const [, apiVersion, endpoint, ...pathComponents] = path.split("/"); /* eslint-disable-line */
  if (endpoint === 'devices') {
    if (req.method === 'POST') {
      // Register Device
      const [deviceLibraryIdentifier, , passTypeIdentifier, serialNumber] = pathComponents;
      const { pushToken } = req.body as Record<string, any>;

      const pass = await modules.passes.findAppleWalletPass(passTypeIdentifier, serialNumber);

      if (pass) {
        if (
          !isAuthenticationTokenCorrect(
            req,
            (pass.meta.rawData as any)._id || (pass.meta.rawData as any).tokenId,
          )
        ) {
          reply.status(401);
          return reply.send();
        }

        const newRegistration = await modules.passes.registerDeviceForAppleWalletPass(
          passTypeIdentifier,
          serialNumber,
          {
            deviceLibraryIdentifier,
            pushToken,
          },
        );

        if (!newRegistration) {
          reply.status(200);
          return reply.send();
        }

        reply.status(201);
        return reply.send();
      }
    } else if (req.method === 'GET') {
      // Get the List of Updatable Passes
      const lastUpdated = new Date();
      const [deviceLibraryIdentifier, , passTypeIdentifier] = pathComponents;
      const passesUpdatedSince =
        (req.query as Record<string, string>)?.passesUpdatedSince &&
        new Date((req.query as Record<string, string>).passesUpdatedSince as string);

      const passes = await modules.passes.findUpdatedAppleWalletPasses(
        passTypeIdentifier,
        deviceLibraryIdentifier,
        passesUpdatedSince,
      );
      const serialNumbers = passes.map((t) => t.meta.serialNumber);

      if (serialNumbers?.length) {
        reply.status(200);
        reply.header('content-type', 'application/json');
        return reply.send(
          JSON.stringify({
            serialNumbers,
            lastUpdated,
          }),
        );
      }

      reply.status(204);
      return reply.send();
    } else if (req.method === 'DELETE') {
      // Unregister Device
      const [deviceLibraryIdentifier, , passTypeIdentifier, serialNumber] = pathComponents;

      const pass = await modules.passes.findAppleWalletPass(passTypeIdentifier, serialNumber);

      if (pass) {
        if (
          !isAuthenticationTokenCorrect(
            req,
            (pass.meta.rawData as any)._id || (pass.meta.rawData as any).tokenId,
          )
        ) {
          reply.status(401);
          return reply.send();
        }

        await modules.passes.unregisterDeviceForAppleWalletPass(
          passTypeIdentifier,
          serialNumber,
          deviceLibraryIdentifier,
        );

        // Unregistered
        reply.status(200);
        return reply.send();
      }
    }
  } else if (endpoint === 'log') {
    // Log Mesage
    const { logs } = req.body as Record<string, any>;
    logs?.forEach((log) => {
      if (typeof log === 'string') {
        logger.info(log);
      }
    });
    reply.status(200);
    return reply.send();
  } else if (endpoint === 'passes') {
    if (req.method === 'GET') {
      // Get an updated Pass
      const [passTypeIdentifier, serialNumber] = pathComponents;

      const pass = await modules.passes.findAppleWalletPass(passTypeIdentifier, serialNumber);

      if (pass) {
        if (
          !isAuthenticationTokenCorrect(
            req,
            (pass.meta.rawData as any)._id || (pass.meta.rawData as any).tokenId,
          )
        ) {
          reply.status(401);
          return reply.send();
        }

        const { updated, created } = pass;

        const lastModifiedDate = new Date(updated || created);
        lastModifiedDate.setMilliseconds(0);

        const ifModifiedSinceDate = new Date(req.headers['if-modified-since']);
        ifModifiedSinceDate.setMilliseconds(0);

        if (ifModifiedSinceDate.getTime() >= lastModifiedDate.getTime()) {
          reply.status(304);
          return reply.send();
        }

        const fileUploadAdapter = getFileAdapter();
        const signedUrl = await fileUploadAdapter.createDownloadURL(pass);
        const url = signedUrl && (await modules.files.normalizeUrl(signedUrl, {}));

        const result = await fetch(url);
        const data = await result.arrayBuffer();
        const uint8View = new Uint8Array(data);

        reply.status(200);
        reply.header('content-type', 'application/vnd.apple.pkpass');
        reply.header('last-modified', lastModifiedDate.toUTCString());
        return reply.send(uint8View);
      }
    }
  }

  reply.status(404);
  return reply.send();
};

export default appleWalletHandler;
