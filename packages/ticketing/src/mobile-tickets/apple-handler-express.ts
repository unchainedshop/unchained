import { createLogger } from '@unchainedshop/logger';
import type { Request, Response } from 'express';
import type { TicketingAPI } from '../types.ts';
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
        res.status(404).end();
        return;
      }

      const token = await modules.warehousing.findToken({
        tokenId,
      });

      if (!token) {
        res.status(404).send('Token not found');
        return;
      }

      const { hash } = req.query;
      const correctHash = await modules.warehousing.buildAccessKeyForToken(tokenId);
      if (!hash || hash !== correctHash) {
        res.status(403).send('Token hash invalid for current owner');
        return;
      }

      const passFile = await modules.passes.upsertAppleWalletPass(token, resolvedContext);

      const fileUploadAdapter = getFileAdapter();
      const signedUrl = await fileUploadAdapter.createDownloadURL(passFile);
      const url = signedUrl && (await modules.files.normalizeUrl(signedUrl, {}));

      if (!url) {
        res.status(500);
        res.send({
          success: false,
          message: 'Could not create download URL',
          name: 'URL_SIGNING_FAILED',
        });
        return;
      }

      const response = await fetch(url);
      const data = await response.arrayBuffer();
      const uint8View = new Uint8Array(data);

      res.status(200);
      res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
      res.setHeader('Content-Disposition', `attachment; filename=${tokenId}.pkpass`);
      res.send(uint8View);
      return;
    } catch (e) {
      logger.error(e);
    }
    res.status(500).end();
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
            (pass.meta?.rawData as any)?._id || (pass.meta?.rawData as any)?.tokenId,
          )
        ) {
          res.status(401).end();
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
          res.status(200).end();
          return;
        }

        res.status(201).end();
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
      const serialNumbers = passes.map((t) => t.meta?.serialNumber).filter(Boolean) as string[];

      if (serialNumbers?.length) {
        res.status(200).send({ serialNumbers, lastUpdated });
        return;
      }

      res.status(204).end();
      return;
    } else if (req.method === 'DELETE') {
      // Unregister Device
      const [deviceLibraryIdentifier, , passTypeIdentifier, serialNumber] = pathComponents;

      const pass = await modules.passes.findAppleWalletPass(passTypeIdentifier, serialNumber);

      if (pass) {
        if (
          !isAuthenticationTokenCorrect(
            req,
            (pass.meta?.rawData as any)?._id || (pass.meta?.rawData as any)?.tokenId,
          )
        ) {
          res.status(401).end();
          return;
        }

        await modules.passes.unregisterDeviceForAppleWalletPass(
          passTypeIdentifier,
          serialNumber,
          deviceLibraryIdentifier,
        );

        // Unregistered
        res.status(200).end();
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
    res.status(200).end();
    return;
  } else if (endpoint === 'passes') {
    if (req.method === 'GET') {
      // Get an updated Pass
      const [passTypeIdentifier, serialNumber] = pathComponents;

      const pass = await modules.passes.findAppleWalletPass(passTypeIdentifier, serialNumber);

      if (!pass) {
        res.status(404).end();
        return;
      }

      if (
        !isAuthenticationTokenCorrect(
          req,
          (pass.meta?.rawData as any)?._id || (pass.meta?.rawData as any)?.tokenId,
        )
      ) {
        res.status(401).end();
        return;
      }

      const { updated, created } = pass;

      const lastModifiedDate = new Date(updated || created);
      lastModifiedDate.setMilliseconds(0);

      const ifModifiedSinceDate = new Date(req.header('if-modified-since')!);
      ifModifiedSinceDate.setMilliseconds(0);

      if (ifModifiedSinceDate.getTime() >= lastModifiedDate.getTime()) {
        res.status(304).end();
        return;
      }

      const fileUploadAdapter = getFileAdapter();
      const signedUrl = await fileUploadAdapter.createDownloadURL(pass);
      const url = signedUrl && (await modules.files.normalizeUrl(signedUrl, {}));

      if (!url) {
        res.status(500);
        res.send({
          success: false,
          message: 'Could not create download URL',
          name: 'URL_SIGNING_FAILED',
        });
        return;
      }

      const result = await fetch(url);
      const data = await result.arrayBuffer();
      const uint8View = new Uint8Array(data);

      res.writeHead(200, {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Last-Modified': lastModifiedDate.toUTCString(),
      });
      res.send(uint8View);
      return;
    }
  }

  res.status(404).end();
};

export default appleWalletHandler;
