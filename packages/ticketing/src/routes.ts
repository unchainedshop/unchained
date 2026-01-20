import { Readable } from 'node:stream';
import { checkAction } from '@unchainedshop/api/lib/acl.js';
import { actions } from '@unchainedshop/api/lib/roles/index.js';
import type { Context } from '@unchainedshop/api';
import { RendererTypes, getRenderer } from './template-registry.ts';
import { createLogger } from '@unchainedshop/logger';
import { getFileAdapter } from '@unchainedshop/core';
import type { TicketingAPI } from './types.ts';

const logger = createLogger('unchained:ticketing');

const {
  APPLE_WALLET_WEBSERVICE_PATH = '/rest/apple-wallet',
  GOOGLE_WALLET_WEBSERVICE_PATH = '/rest/google-wallet',
  UNCHAINED_PDF_PRINT_HANDLER_PATH = '/rest/print_tickets',
} = process.env;

const isAuthenticationTokenCorrect = (authHeader: string | null, authenticationToken: string) => {
  const expectedAuthorizationValue = `ApplePass ${authenticationToken}`;
  return authHeader === expectedAuthorizationValue;
};

// Print tickets handler
export async function printTicketsHandler(request: Request, context: Context): Promise<Response> {
  const url = new URL(request.url);
  const variant = url.searchParams.get('variant');
  const orderId = url.searchParams.get('orderId');
  const otp = url.searchParams.get('otp');

  try {
    if (!orderId || !otp) {
      throw new Error('Missing required query parameters: orderId and otp');
    }

    await checkAction(context, actions.viewOrder, [undefined, { orderId, otp }]);

    const render = getRenderer(RendererTypes.ORDER_PDF);
    const pdfStream = await render({ orderId, variant: variant as string }, context);

    // Convert Node.js Readable to WHATWG ReadableStream
    const webStream = Readable.toWeb(pdfStream) as ReadableStream;

    return new Response(webStream, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
      },
    });
  } catch (error) {
    logger.error(error);
    return new Response(null, { status: 403 });
  }
}

// Google Wallet handler
export async function googleWalletHandler(
  request: Request,
  context: TicketingAPI & { params: Record<string, string> },
): Promise<Response> {
  const { modules } = context;
  const { tokenId } = context.params;

  try {
    if (!tokenId) {
      return new Response(JSON.stringify({ error: 'Token ID required' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = await modules.warehousing.findToken({ tokenId });

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const hash = url.searchParams.get('hash');
    const correctHash = await modules.warehousing.buildAccessKeyForToken(tokenId);

    if (!hash || hash !== correctHash) {
      return new Response(JSON.stringify({ error: 'Token hash invalid for current owner' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const passLink = await modules.passes.upsertGoogleWalletPass(token, context);

    return new Response(JSON.stringify({ passLink }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    logger.error(e);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Apple Wallet handler
export async function appleWalletHandler(
  request: Request,
  context: TicketingAPI & { params: Record<string, string> },
): Promise<Response> {
  const { modules } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  logger.info(`${pathname} (${JSON.stringify(Object.fromEntries(url.searchParams))})`);

  // Handle download path
  if (pathname.includes('/download/')) {
    try {
      const pathParts = pathname.split('/');
      const passFileName = pathParts[pathParts.length - 1];
      const [tokenId] = passFileName.split('.pkpass');

      if (!tokenId) {
        return new Response(null, { status: 404 });
      }

      const token = await modules.warehousing.findToken({ tokenId });

      if (!token) {
        return new Response(JSON.stringify({ error: 'Token not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const hash = url.searchParams.get('hash');
      const correctHash = await modules.warehousing.buildAccessKeyForToken(tokenId);

      if (!hash || hash !== correctHash) {
        return new Response(JSON.stringify({ error: 'Token hash invalid for current owner' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const passFile = await modules.passes.upsertAppleWalletPass(token, context);

      const fileUploadAdapter = getFileAdapter();
      const signedUrl = await fileUploadAdapter.createDownloadURL(passFile);
      const downloadUrl = signedUrl && (await modules.files.normalizeUrl(signedUrl, {}));

      if (!downloadUrl) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Could not create download URL',
            name: 'URL_SIGNING_FAILED',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      const response = await fetch(downloadUrl);
      const data = await response.arrayBuffer();

      return new Response(data, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.apple.pkpass',
          'Content-Disposition': `attachment; filename=${tokenId}.pkpass`,
        },
      });
    } catch (e) {
      logger.error(e);
      return new Response(null, { status: 500 });
    }
  }

  const pathParts = pathname.split('/').filter(Boolean);
  const [, , endpoint, ...pathComponents] = pathParts;

  // Device registration endpoints
  if (endpoint === 'devices') {
    if (request.method === 'POST') {
      // Register Device
      const [deviceLibraryIdentifier, , passTypeIdentifier, serialNumber] = pathComponents;

      try {
        const body = await request.json();
        const { pushToken } = body;

        const pass = await modules.passes.findAppleWalletPass(passTypeIdentifier, serialNumber);

        if (!pass) {
          return new Response(null, { status: 404 });
        }

        const authToken = (pass.meta?.rawData as any)?._id || (pass.meta?.rawData as any)?.tokenId;
        if (!isAuthenticationTokenCorrect(request.headers.get('authorization'), authToken)) {
          return new Response(null, { status: 401 });
        }

        const newRegistration = await modules.passes.registerDeviceForAppleWalletPass(
          passTypeIdentifier,
          serialNumber,
          {
            deviceLibraryIdentifier,
            pushToken,
          },
        );

        return new Response(null, { status: newRegistration ? 201 : 200 });
      } catch (e) {
        logger.error(e);
        return new Response(null, { status: 500 });
      }
    } else if (request.method === 'GET') {
      // Get the List of Updatable Passes
      const [deviceLibraryIdentifier, , passTypeIdentifier] = pathComponents;
      const passesUpdatedSinceParam = url.searchParams.get('passesUpdatedSince');
      const passesUpdatedSince = passesUpdatedSinceParam ? new Date(passesUpdatedSinceParam) : undefined;

      try {
        const passes = await modules.passes.findUpdatedAppleWalletPasses(
          passTypeIdentifier,
          deviceLibraryIdentifier,
          passesUpdatedSince,
        );
        const serialNumbers = passes.map((t) => t.meta?.serialNumber).filter(Boolean) as string[];

        if (serialNumbers?.length) {
          return new Response(
            JSON.stringify({
              serialNumbers,
              lastUpdated: new Date(),
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            },
          );
        }

        return new Response(null, { status: 204 });
      } catch (e) {
        logger.error(e);
        return new Response(null, { status: 500 });
      }
    } else if (request.method === 'DELETE') {
      // Unregister Device
      const [deviceLibraryIdentifier, , passTypeIdentifier, serialNumber] = pathComponents;

      try {
        const pass = await modules.passes.findAppleWalletPass(passTypeIdentifier, serialNumber);

        if (!pass) {
          return new Response(null, { status: 404 });
        }

        const authToken = (pass.meta?.rawData as any)?._id || (pass.meta?.rawData as any)?.tokenId;
        if (!isAuthenticationTokenCorrect(request.headers.get('authorization'), authToken)) {
          return new Response(null, { status: 401 });
        }

        await modules.passes.unregisterDeviceForAppleWalletPass(
          passTypeIdentifier,
          serialNumber,
          deviceLibraryIdentifier,
        );

        return new Response(null, { status: 200 });
      } catch (e) {
        logger.error(e);
        return new Response(null, { status: 500 });
      }
    }
  } else if (endpoint === 'log') {
    // Log Message
    try {
      const body = await request.json();
      const { logs } = body;
      logs?.forEach((log: any) => {
        if (typeof log === 'string') {
          logger.info(log);
        }
      });
      return new Response(null, { status: 200 });
    } catch (e) {
      logger.error(e);
      return new Response(null, { status: 500 });
    }
  } else if (endpoint === 'passes') {
    if (request.method === 'GET') {
      // Get an updated Pass
      const [passTypeIdentifier, serialNumber] = pathComponents;

      try {
        const pass = await modules.passes.findAppleWalletPass(passTypeIdentifier, serialNumber);

        if (!pass) {
          return new Response(null, { status: 404 });
        }

        const authToken = (pass.meta?.rawData as any)?._id || (pass.meta?.rawData as any)?.tokenId;
        if (!isAuthenticationTokenCorrect(request.headers.get('authorization'), authToken)) {
          return new Response(null, { status: 401 });
        }

        const { updated, created } = pass;
        const lastModifiedDate = new Date(updated || created);
        lastModifiedDate.setMilliseconds(0);

        const ifModifiedSinceHeader = request.headers.get('if-modified-since');
        if (ifModifiedSinceHeader) {
          const ifModifiedSinceDate = new Date(ifModifiedSinceHeader);
          ifModifiedSinceDate.setMilliseconds(0);

          if (ifModifiedSinceDate.getTime() >= lastModifiedDate.getTime()) {
            return new Response(null, { status: 304 });
          }
        }

        const fileUploadAdapter = getFileAdapter();
        const signedUrl = await fileUploadAdapter.createDownloadURL(pass);
        const downloadUrl = signedUrl && (await modules.files.normalizeUrl(signedUrl, {}));

        if (!downloadUrl) {
          return new Response(
            JSON.stringify({
              success: false,
              message: 'Could not create download URL',
              name: 'URL_SIGNING_FAILED',
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            },
          );
        }

        const result = await fetch(downloadUrl);
        const data = await result.arrayBuffer();

        return new Response(data, {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.apple.pkpass',
            'Last-Modified': lastModifiedDate.toUTCString(),
          },
        });
      } catch (e) {
        logger.error(e);
        return new Response(null, { status: 500 });
      }
    }
  }

  return new Response(null, { status: 404 });
}

export const ticketingRoutes = [
  {
    path: UNCHAINED_PDF_PRINT_HANDLER_PATH,
    handler: printTicketsHandler,
  },
  {
    path: `${GOOGLE_WALLET_WEBSERVICE_PATH}/download/:tokenId`,
    handler: googleWalletHandler,
  },
  {
    path: `${APPLE_WALLET_WEBSERVICE_PATH}/*`,
    handler: appleWalletHandler,
  },
];
