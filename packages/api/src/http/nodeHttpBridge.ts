import type { IncomingMessage, ServerResponse } from 'node:http';
import type { TLSSocket } from 'node:tls';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { ReadableStream } from 'node:stream/web';

export const getNodeHeader = (request: IncomingMessage, name: string): string | undefined => {
  const value = request.headers[name.toLowerCase()];
  return Array.isArray(value) ? value.join(', ') : value;
};

const requestURL = (request: IncomingMessage, protocol: string, path: string) => {
  const host = request.headers.host || request.headers[':authority'] || 'localhost';
  return (
    URL.parse(path, `${protocol}://${host}`) ??
    URL.parse(path, `${protocol}://localhost`) ??
    new URL(`${protocol}://localhost/`)
  );
};

export function toWebRequest(
  request: IncomingMessage,
  response: ServerResponse,
  {
    protocol = (request.socket as TLSSocket | undefined)?.encrypted ? 'https' : 'http',
    path = request.url || '/',
    body,
  }: { protocol?: string; path?: string; body?: unknown } = {},
): Request {
  const clientHangUp = new AbortController();
  response.once('close', () => {
    if (!response.writableFinished) clientHangUp.abort();
  });

  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (name.startsWith(':') || value === undefined) continue;
    for (const entry of [value].flat()) headers.append(name, entry);
  }

  const method = request.method?.toUpperCase() || 'GET';
  const init: RequestInit & { duplex?: 'half' } = { method, headers, signal: clientHangUp.signal };
  if (method !== 'GET' && method !== 'HEAD') {
    const source = body ?? (request.readableEnded || request.destroyed ? undefined : request);
    if (source instanceof Readable) {
      init.body = ReadableStream.from(source) as BodyInit;
      init.duplex = 'half';
    } else if (source !== undefined) {
      headers.delete('content-length');
      if (typeof source === 'string' || source instanceof Uint8Array) {
        init.body = source as BodyInit;
      } else {
        init.body = JSON.stringify(source);
        headers.set('content-type', 'application/json');
      }
    }
  }
  return new Request(requestURL(request, protocol, path), init);
}

const toNodeHeaders = (headers: Headers) => {
  const nodeHeaders: Record<string, string | string[]> = {};
  headers.forEach((value, name) => {
    nodeHeaders[name] = name.toLowerCase() === 'set-cookie' ? headers.getSetCookie() : value;
  });
  return nodeHeaders;
};

const readSmallBody = async (webResponse: Response) =>
  webResponse.body && Number(webResponse.headers.get('content-length') ?? Infinity) <= 64 * 1024
    ? Buffer.from(await webResponse.arrayBuffer())
    : undefined;

export async function sendWebResponse(response: ServerResponse, webResponse: Response): Promise<void> {
  if (response.destroyed || response.writableEnded) {
    await webResponse.body?.cancel().catch(() => undefined);
    return;
  }

  const smallBody = await readSmallBody(webResponse);
  response.writeHead(webResponse.status, toNodeHeaders(webResponse.headers));
  if (smallBody || !webResponse.body) {
    response.end(smallBody);
    return;
  }

  const { body } = webResponse;
  const source = body instanceof ReadableStream ? Readable.fromWeb(body) : Readable.from(body);
  await pipeline(source, response).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== 'ERR_STREAM_PREMATURE_CLOSE') throw error;
  });
}
