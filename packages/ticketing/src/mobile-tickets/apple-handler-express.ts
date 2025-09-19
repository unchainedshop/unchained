import { createLogger } from '@unchainedshop/logger';
import type { Request, Response } from 'express';
import { TicketingAPI } from '../types.js';
import { getFileAdapter } from '@unchainedshop/core-files';

const logger = createLogger('unchained:apple-wallet-webservice');

const isAuthenticationTokenCorrect = (req, authenticationToken) => {
  const expectedAuthorizationValue = `ApplePass ${authenticationToken}`;
  return req.headers.authorization === expectedAuthorizationValue;
};

const appleWalletHandler = async (req: Request & { unchainedContext: TicketingAPI }, res: Response) => {
  const resolvedContext = req.unchainedContext;
  const { modules } = resolvedContext;
  logger.info(`${req.path} (${JSON.stringify(req.query)})`);

  if (req.path.startsWith('/download/')) {
    try {
      const [, , passFileName] = req.path.split('/');
      const [tokenId] = passFileName.split('.pkpass');

      if (!tokenId) {
        res.writeHead(404);
        res.end();
        return;
      }

      const token = await modules.warehousing.findToken({
        tokenId,
      });

      if (!token) {
        res.writeHead(404);
        res.end('Token not found');
        return;
      }

      const { hash } = req.query;
      const correctHash = await modules.warehousing.buildAccessKeyForToken(tokenId);
      if (hash !== correctHash) {
        res.writeHead(403);
        res.end('Token hash invalid for current owner');
        return;
      }

      const passFile = await modules.passes.upsertAppleWalletPass(token, resolvedContext);

      const fileUploadAdapter = getFileAdapter();
      const signedUrl = await fileUploadAdapter.createDownloadURL(passFile);
      const url = signedUrl && (await modules.files.normalizeUrl(signedUrl, {}));

      const response = await fetch(url);
      const data = await response.arrayBuffer();
      const uint8View = new Uint8Array(data);

      res.status(200);
      res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
      res.setHeader('Content-Disposition', `attachment; filename=${tokenId}.pkpass`);
      res.end(uint8View);
      return;
    } catch (e) {
      logger.error(e);
    }
    res.writeHead(500);
    res.end();
    return;
  }

  const [, apiVersion, endpoint, ...pathComponents] = req.path.split("/"); /* eslint-disable-line */
  if (endpoint === 'devices') {
    if (req.method === 'POST') {
      // Register Device
      const [deviceLibraryIdentifier, , passTypeIdentifier, serialNumber] = pathComponents;
      const { pushToken } = req.body;

      const pass = await modules.passes.findAppleWalletPass(passTypeIdentifier, serialNumber);

      if (pass) {
        if (
          !isAuthenticationTokenCorrect(
            req,
            (pass.meta.rawData as any)._id || (pass.meta.rawData as any).tokenId,
          )
        ) {
          res.writeHead(401);
          res.end();
          return;
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
          res.writeHead(200);
          res.end();
          return;
        }

        res.writeHead(201);
        res.end();
        return;
      }
    } else if (req.method === 'GET') {
      // Get the List of Updatable Passes
      const lastUpdated = new Date();
      const [deviceLibraryIdentifier, , passTypeIdentifier] = pathComponents;
      const passesUpdatedSince =
        req.query?.passesUpdatedSince && new Date(req.query.passesUpdatedSince as string);

      const passes = await modules.passes.findUpdatedAppleWalletPasses(
        passTypeIdentifier,
        deviceLibraryIdentifier,
        passesUpdatedSince,
      );
      const serialNumbers = passes.map((t) => t.meta.serialNumber);

      if (serialNumbers?.length) {
        res.writeHead(200, {
          'Content-Type': 'application/json',
        });
        res.write(
          JSON.stringify({
            serialNumbers,
            lastUpdated,
          }),
        );
        res.end();
        return;
      }

      res.writeHead(204);
      res.end();
      return;
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
          res.writeHead(401);
          res.end();
          return;
        }

        await modules.passes.unregisterDeviceForAppleWalletPass(
          passTypeIdentifier,
          serialNumber,
          deviceLibraryIdentifier,
        );

        // Unregistered
        res.writeHead(200);
        res.end();
        return;
      }
    }
  } else if (endpoint === 'log') {
    // Log Mesage
    const { logs } = req.body;
    logs?.forEach((log) => {
      if (typeof log === 'string') {
        logger.info(log);
      }
    });
    res.writeHead(200);
    res.end();
    return;
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
          res.writeHead(401);
          res.end();
          return;
        }

        const { updated, created } = pass;

        const lastModifiedDate = new Date(updated || created);
        lastModifiedDate.setMilliseconds(0);

        const ifModifiedSinceDate = new Date(req.header('if-modified-since'));
        ifModifiedSinceDate.setMilliseconds(0);

        if (ifModifiedSinceDate.getTime() >= lastModifiedDate.getTime()) {
          res.writeHead(304);
          res.end();
          return;
        }

        const fileUploadAdapter = getFileAdapter();
        const signedUrl = await fileUploadAdapter.createDownloadURL(pass);
        const url = signedUrl && (await modules.files.normalizeUrl(signedUrl, {}));

        const result = await fetch(url);
        const data = await result.arrayBuffer();
        const uint8View = new Uint8Array(data);

        res.writeHead(200, {
          'Content-Type': 'application/vnd.apple.pkpass',
          'Last-Modified': lastModifiedDate.toUTCString(),
        });
        res.end(uint8View);
        return;
      }
    }
  }

  res.writeHead(404);
  res.end();
};

export default appleWalletHandler;
