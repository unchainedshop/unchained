import type { IncomingMessage, ServerResponse } from 'node:http';
import type { TLSSocket } from 'node:tls';
import { Readable, pipeline } from 'node:stream';
import { ReadableStream } from 'node:stream/web';

// Minimal Node <-> web-standard HTTP bridge for every engine endpoint. Owning these lines keeps
// server adapters such as @whatwg-node/server or @modelcontextprotocol/node (and its hono peer
// dependency) out of the engine's own dependencies.

export interface WebRequestOptions {
  /** Protocol of the request as the server sees it (behind a trusted proxy: X-Forwarded-Proto) */
  protocol?: string;
  /** Path and query of the request, e.g. the original URL of a router that strips mount paths */
  path?: string;
  /**
   * Body a framework already read: a string or bytes as received, a stream, or an object a body
   * parser created, which is passed on as JSON
   */
  body?: unknown;
}

/** False for CONNECT, TRACE and TRACK: the Fetch standard refuses them, so no web request carries them */
export const isWebRequestMethod = (method = 'GET') =>
  !['CONNECT', 'TRACE', 'TRACK'].includes(method.toUpperCase());

/** Reads a request header like Headers.get(): by case-insensitive name, repeated values joined */
export const getNodeHeader = (request: IncomingMessage, name: string): string | undefined => {
  const value = request.headers[name.toLowerCase()];
  return Array.isArray(value) ? value.join(', ') : value;
};

const requestURL = (request: IncomingMessage, protocol: string, path: string): URL => {
  // A malformed (client-controlled) Host header must not throw before the auth wall —
  // fall back so the handler can still answer based on auth state alone.
  const host = request.headers.host || request.headers[':authority'] || 'localhost';
  try {
    return new URL(path, `${protocol}://${host}`);
  } catch {
    try {
      return new URL(path, `${protocol}://localhost`);
    } catch {
      return new URL(`${protocol}://localhost/`);
    }
  }
};

export function toWebRequest(
  request: IncomingMessage,
  response: ServerResponse,
  {
    protocol = (request.socket as TLSSocket | undefined)?.encrypted ? 'https' : 'http',
    path = request.url || '/',
    body,
  }: WebRequestOptions = {},
): Request {
  const controller = new AbortController();
  // Client hang-up must cancel the in-flight exchange. The signal for that is the RESPONSE
  // closing before it finished — the request stream's 'close' is useless here: it fires on
  // normal completion as soon as the body was consumed, which a body parser may have done
  // before this bridge runs.
  response.once('close', () => {
    if (!response.writableFinished) controller.abort();
  });

  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    // HTTP/2 pseudo-headers (:method, :path, ...) are not header fields
    if (name.startsWith(':') || value === undefined) continue;
    if (Array.isArray(value)) {
      for (const entry of value) headers.append(name, entry);
    } else {
      headers.set(name, value);
    }
  }

  const method = request.method?.toUpperCase() || 'GET';
  const init: RequestInit & { duplex?: 'half' } = { method, headers, signal: controller.signal };

  if (method !== 'GET' && method !== 'HEAD') {
    // Without a body from the framework, stream the request itself unless it was already read
    const source = body ?? (request.readableEnded || request.destroyed ? undefined : request);
    if (source instanceof Readable) {
      // Pulled on demand: a handler that never reads the body leaves the stream untouched
      init.body = ReadableStream.from(source) as BodyInit;
      init.duplex = 'half';
    } else if (source !== undefined) {
      // A body the framework already read arrives as given or re-serialized, so the original
      // content-length no longer applies.
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

/** Small bodies of known length, like GraphQL results, are sent in one piece instead of streamed */
const readSmallBody = async (webResponse: Response) =>
  webResponse.body && Number(webResponse.headers.get('content-length') ?? Infinity) <= 64 * 1024
    ? Buffer.from(await webResponse.arrayBuffer())
    : undefined;

export async function sendWebResponse(response: ServerResponse, webResponse: Response): Promise<void> {
  if (response.destroyed || response.writableEnded) {
    // The client is already gone — release the response stream and settle.
    await webResponse.body?.cancel().catch(() => undefined);
    return;
  }

  const smallBody = await readSmallBody(webResponse);
  response.writeHead(webResponse.status, toNodeHeaders(webResponse.headers));

  if (smallBody || !webResponse.body) {
    response.end(smallBody);
    return;
  }

  // fromWeb cancels a pending read when the client leaves, Readable.from takes the async
  // iterable bodies of other implementations, like the ponyfill streams of GraphQL Yoga
  const { body } = webResponse;
  const source = body instanceof ReadableStream ? Readable.fromWeb(body) : Readable.from(body);
  await new Promise<void>((resolve, reject) => {
    pipeline(source, response, (error) => {
      // The client closing the connection (e.g. dropping an SSE stream) is a normal outcome.
      if (!error || (error as NodeJS.ErrnoException).code === 'ERR_STREAM_PREMATURE_CLOSE') {
        resolve();
      } else {
        reject(error);
      }
    });
  });
}
