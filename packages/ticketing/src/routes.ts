import { Readable } from 'node:stream';
import { acl, roles, type Context } from '@unchainedshop/api';
import type { PluginHttpRoute } from '@unchainedshop/core';
import type { File } from '@unchainedshop/core-files';
import type { TokenSurrogate } from '@unchainedshop/core-warehousing';
import { createLogger } from '@unchainedshop/logger';
import { timingSafeStringEqual } from '@unchainedshop/utils';
import { RendererTypes, getRenderer, hasRenderer } from './template-registry.ts';
import type { TicketingAPI } from './index.ts';

const logger = createLogger('unchained:ticketing');

export interface TicketingPaths {
  printTickets: string;
  googleWallet: string;
  appleWallet: string;
}

const withoutTrailingSlash = (path: string) => path.replace(/\/+$/, '');

/**
 * Base paths of the ticketing routes, read from the environment on every call.
 * Issued Apple passes carry ROOT_URL + appleWallet as webServiceURL, so keep it stable.
 */
export function getTicketingPaths(): TicketingPaths {
  const {
    UNCHAINED_PDF_PRINT_HANDLER_PATH = '/rest/print_tickets',
    GOOGLE_WALLET_WEBSERVICE_PATH = '/rest/google-wallet',
    APPLE_WALLET_WEBSERVICE_PATH = '/rest/apple-wallet',
  } = process.env;
  return {
    printTickets: withoutTrailingSlash(UNCHAINED_PDF_PRINT_HANDLER_PATH),
    googleWallet: withoutTrailingSlash(GOOGLE_WALLET_WEBSERVICE_PATH),
    appleWallet: withoutTrailingSlash(APPLE_WALLET_WEBSERVICE_PATH),
  };
}

/** The HTTP connectors pass the request context merged with the unchained API and the path params. */
export type TicketingRouteContext = Context & TicketingAPI & { params: Record<string, string> };

type TicketingRouteHandler = (request: Request, context: TicketingRouteContext) => Promise<Response>;

const json = (status: number, body: unknown) => Response.json(body, { status });

const hasValidAccessKey = async (
  token: TokenSurrogate,
  hash: string | null,
  { modules }: TicketingRouteContext,
) =>
  Boolean(hash) &&
  timingSafeStringEqual(await modules.warehousing.buildAccessKeyFromToken(token), hash!);

const toWebStream = (stream: NodeJS.ReadableStream) =>
  Readable.toWeb(stream instanceof Readable ? stream : new Readable().wrap(stream)) as ReadableStream;

async function sendPassFile(
  file: File,
  { services }: TicketingRouteContext,
  headers: Record<string, string> = {},
): Promise<Response> {
  const stream = await services.files.createDownloadStream({ fileId: file._id });
  if (!stream) return json(404, { error: 'Pass file not found' });
  return new Response(toWebStream(stream), {
    status: 200,
    headers: { 'Content-Type': 'application/vnd.apple.pkpass', ...headers },
  });
}

// PassKit authenticates with the authenticationToken baked into the pass, which is the token id.
const isAuthorizedForPass = async (request: Request, pass: File) => {
  const rawData = pass.meta?.rawData as { _id?: string; tokenId?: string } | undefined;
  const authenticationToken = rawData?._id || rawData?.tokenId;
  const authorization = request.headers.get('authorization');
  if (!authenticationToken || !authorization) return false;
  return timingSafeStringEqual(authorization, `ApplePass ${authenticationToken}`);
};

/** GET {print}?orderId&otp[&variant]: the order's ticket PDF for viewers of the order. */
export async function printTicketsHandler(
  request: Request,
  context: TicketingRouteContext,
): Promise<Response> {
  const url = new URL(request.url);
  const orderId = url.searchParams.get('orderId');
  const otp = url.searchParams.get('otp') || undefined;
  const variant = url.searchParams.get('variant') || undefined;
  if (!orderId) return new Response(null, { status: 403 });

  try {
    // The ticketing magic-key rule accepts the otp, the order owner and admins pass without one.
    await acl.checkAction(context, roles.actions.viewOrder, [undefined, { orderId, otp }]);
  } catch {
    return new Response(null, { status: 403 });
  }

  if (!hasRenderer(RendererTypes.ORDER_PDF)) return json(404, { error: 'Ticket PDF not configured' });
  const order = await context.modules.orders.findOrder({ orderId });
  if (!order) return json(404, { error: 'Order not found' });

  try {
    const render = getRenderer(RendererTypes.ORDER_PDF);
    const pdfStream = await render({ orderId, variant }, context);
    return new Response(toWebStream(pdfStream), {
      status: 200,
      headers: { 'Content-Type': 'application/pdf', 'Cache-Control': 'private, no-store' },
    });
  } catch (e) {
    logger.error(e);
    return new Response(null, { status: 500 });
  }
}

/** GET {google}/download/:tokenId?hash=: redirects to the Google Wallet save link. */
export async function googleWalletDownloadHandler(
  request: Request,
  context: TicketingRouteContext,
): Promise<Response> {
  const { tokenId } = context.params;
  const token = tokenId ? await context.modules.warehousing.findToken({ tokenId }) : null;
  if (!token) return json(404, { error: 'Token not found' });

  const hash = new URL(request.url).searchParams.get('hash');
  if (!(await hasValidAccessKey(token, hash, context))) {
    return json(403, { error: 'Token hash invalid for current owner' });
  }
  if (!hasRenderer(RendererTypes.GOOGLE_WALLET)) {
    return json(404, { error: 'Google Wallet not configured' });
  }

  try {
    const pass = await context.modules.passes.upsertGoogleWalletPass(token, context);
    const passLink = typeof pass === 'string' ? pass : await pass?.asURL();
    if (!passLink) return json(404, { error: 'Google Wallet pass not available' });

    // Reject anything but an absolute http(s) URL before it ends up in the Location header.
    if (!['https:', 'http:'].includes(new URL(passLink).protocol)) {
      throw new Error(`Google Wallet renderer returned an unsupported link for token ${token._id}`);
    }
    return new Response(null, {
      status: 302,
      headers: { Location: passLink, 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    logger.error(e);
    return json(500, { error: 'Internal server error' });
  }
}

/** GET {apple}/download/:passFileName?hash=: the pkpass of the token named `<tokenId>.pkpass`. */
export async function appleWalletDownloadHandler(
  request: Request,
  context: TicketingRouteContext,
): Promise<Response> {
  const tokenId = context.params.passFileName?.replace(/\.pkpass$/, '');
  const token = tokenId ? await context.modules.warehousing.findToken({ tokenId }) : null;
  if (!token) return json(404, { error: 'Token not found' });

  const hash = new URL(request.url).searchParams.get('hash');
  if (!(await hasValidAccessKey(token, hash, context))) {
    return json(403, { error: 'Token hash invalid for current owner' });
  }
  if (!hasRenderer(RendererTypes.APPLE_WALLET)) {
    return json(404, { error: 'Apple Wallet not configured' });
  }

  try {
    const passFile = await context.modules.passes.upsertAppleWalletPass(token, context);
    return await sendPassFile(passFile, context, {
      'Content-Disposition': `attachment; filename=${token._id}.pkpass`,
      'Cache-Control': 'no-store',
    });
  } catch (e) {
    logger.error(e);
    return new Response(null, { status: 500 });
  }
}

/** POST {apple}/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber */
export async function appleRegisterDeviceHandler(
  request: Request,
  context: TicketingRouteContext,
): Promise<Response> {
  const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = context.params;
  const { passes } = context.modules;
  try {
    const pass = await passes.findAppleWalletPass(passTypeIdentifier, serialNumber);
    if (!pass) return new Response(null, { status: 404 });
    if (!(await isAuthorizedForPass(request, pass))) return new Response(null, { status: 401 });

    const { pushToken } = await request.json().catch(() => ({}));
    if (!pushToken) return new Response(null, { status: 400 });

    const newRegistration = await passes.registerDeviceForAppleWalletPass(
      passTypeIdentifier,
      serialNumber,
      { deviceLibraryIdentifier, pushToken },
    );
    return new Response(null, { status: newRegistration ? 201 : 200 });
  } catch (e) {
    logger.error(e);
    return new Response(null, { status: 500 });
  }
}

/** DELETE {apple}/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber */
export async function appleUnregisterDeviceHandler(
  request: Request,
  context: TicketingRouteContext,
): Promise<Response> {
  const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = context.params;
  const { passes } = context.modules;
  try {
    const pass = await passes.findAppleWalletPass(passTypeIdentifier, serialNumber);
    if (!pass) return new Response(null, { status: 404 });
    if (!(await isAuthorizedForPass(request, pass))) return new Response(null, { status: 401 });

    await passes.unregisterDeviceForAppleWalletPass(
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

/** GET {apple}/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier[?passesUpdatedSince] */
export async function appleUpdatablePassesHandler(
  request: Request,
  context: TicketingRouteContext,
): Promise<Response> {
  const { deviceLibraryIdentifier, passTypeIdentifier } = context.params;
  const passesUpdatedSinceParam = new URL(request.url).searchParams.get('passesUpdatedSince');
  const passesUpdatedSinceDate = passesUpdatedSinceParam ? new Date(passesUpdatedSinceParam) : undefined;
  const passesUpdatedSince =
    passesUpdatedSinceDate && !Number.isNaN(passesUpdatedSinceDate.getTime())
      ? passesUpdatedSinceDate
      : undefined;

  try {
    const passes = await context.modules.passes.findUpdatedAppleWalletPasses(
      passTypeIdentifier,
      deviceLibraryIdentifier,
      passesUpdatedSince,
    );
    const serialNumbers = passes.map((pass) => pass.meta?.serialNumber).filter(Boolean) as string[];
    if (!serialNumbers.length) return new Response(null, { status: 204 });
    return json(200, { serialNumbers, lastUpdated: new Date().toISOString() });
  } catch (e) {
    logger.error(e);
    return new Response(null, { status: 500 });
  }
}

/** GET {apple}/v1/passes/:passTypeIdentifier/:serialNumber: the latest version of a pass. */
export async function appleLatestPassHandler(
  request: Request,
  context: TicketingRouteContext,
): Promise<Response> {
  const { passTypeIdentifier, serialNumber } = context.params;
  try {
    const pass = await context.modules.passes.findAppleWalletPass(passTypeIdentifier, serialNumber);
    if (!pass) return new Response(null, { status: 404 });
    if (!(await isAuthorizedForPass(request, pass))) return new Response(null, { status: 401 });

    const lastModifiedDate = new Date(pass.updated || pass.created);
    lastModifiedDate.setMilliseconds(0);

    const ifModifiedSinceHeader = request.headers.get('if-modified-since');
    if (ifModifiedSinceHeader) {
      const ifModifiedSinceDate = new Date(ifModifiedSinceHeader);
      ifModifiedSinceDate.setMilliseconds(0);
      if (ifModifiedSinceDate.getTime() >= lastModifiedDate.getTime()) {
        return new Response(null, { status: 304 });
      }
    }

    return await sendPassFile(pass, context, { 'Last-Modified': lastModifiedDate.toUTCString() });
  } catch (e) {
    logger.error(e);
    return new Response(null, { status: 500 });
  }
}

/** POST {apple}/v1/log: error messages reported by devices. */
export async function appleLogHandler(request: Request): Promise<Response> {
  const { logs } = await request.json().catch(() => ({}));
  if (Array.isArray(logs)) {
    logs.forEach((log) => {
      if (typeof log === 'string') logger.info(log);
    });
  }
  return new Response(null, { status: 200 });
}

// PluginHttpRoute types its context as UnchainedCore; the connectors pass the full request context.
const route = (
  method: PluginHttpRoute['method'],
  path: string,
  handler: TicketingRouteHandler,
): PluginHttpRoute => ({ method, path, handler: handler as unknown as PluginHttpRoute['handler'] });

/** The ticketing HTTP routes: ticket PDF, Google Wallet redirect and the Apple PassKit web service. */
export function createTicketingRoutes(paths: TicketingPaths = getTicketingPaths()): PluginHttpRoute[] {
  const { printTickets, googleWallet, appleWallet } = paths;
  const deviceRegistrations = `${appleWallet}/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier`;
  return [
    route('GET', printTickets, printTicketsHandler),
    route('GET', `${googleWallet}/download/:tokenId`, googleWalletDownloadHandler),
    route('GET', `${appleWallet}/download/:passFileName`, appleWalletDownloadHandler),
    route('POST', `${deviceRegistrations}/:serialNumber`, appleRegisterDeviceHandler),
    route('DELETE', `${deviceRegistrations}/:serialNumber`, appleUnregisterDeviceHandler),
    route('GET', deviceRegistrations, appleUpdatablePassesHandler),
    route('GET', `${appleWallet}/v1/passes/:passTypeIdentifier/:serialNumber`, appleLatestPassHandler),
    route('POST', `${appleWallet}/v1/log`, appleLogHandler),
  ];
}
