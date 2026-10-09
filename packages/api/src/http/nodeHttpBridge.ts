import type { IncomingMessage, ServerResponse } from 'node:http';
import { Readable, pipeline } from 'node:stream';

// Minimal Node <-> web-standard HTTP bridge for plugin routes and the MCP handler. Owning these
// lines keeps @whatwg-node/server and @modelcontextprotocol/node (and its hono peer dependency)
// out of the dependency tree.

export type NodeRequestBody = string | Uint8Array | Readable;

export function toWebRequest(
  request: IncomingMessage,
  response: ServerResponse,
  body?: NodeRequestBody,
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
  for (const [key, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) {
      for (const entry of value) headers.append(key, entry);
    } else if (value != null) {
      headers.set(key, value);
    }
  }

  // A body the framework already parsed arrives re-serialized, so the original
  // content-length no longer applies.
  if (body !== undefined && !(body instanceof Readable)) {
    headers.delete('content-length');
  }

  // A malformed (client-controlled) Host header must not throw before the auth wall —
  // fall back so the handler can still answer based on auth state alone.
  let url: URL;
  try {
    url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  } catch {
    try {
      url = new URL(request.url || '/', 'http://localhost');
    } catch {
      url = new URL('http://localhost/');
    }
  }

  const method = request.method?.toUpperCase() || 'GET';
  const canHaveBody = method !== 'GET' && method !== 'HEAD';
  // Without a body from the framework, stream the request itself unless it was already read.
  const bodySource =
    body ?? (canHaveBody && !request.readableEnded && !request.destroyed ? request : undefined);
  const requestInit: RequestInit & { duplex?: 'half' } = {
    method,
    headers,
    signal: controller.signal,
  };

  if (bodySource !== undefined) {
    requestInit.body =
      bodySource instanceof Readable
        ? (Readable.toWeb(bodySource) as BodyInit)
        : (bodySource as BodyInit);
    requestInit.duplex = 'half';
  }

  return new Request(url, requestInit);
}

export async function sendWebResponse(response: ServerResponse, webResponse: Response): Promise<void> {
  if (response.destroyed || response.writableEnded) {
    // The client is already gone — release the response stream and settle.
    await webResponse.body?.cancel().catch(() => undefined);
    return;
  }

  const headers: Record<string, string | string[]> = {};
  webResponse.headers.forEach((value, key) => {
    headers[key] = key === 'set-cookie' ? webResponse.headers.getSetCookie() : value;
  });
  response.writeHead(webResponse.status, headers);

  if (!webResponse.body) {
    response.end();
    return;
  }

  const nodeStream = Readable.fromWeb(webResponse.body as Parameters<typeof Readable.fromWeb>[0]);
  await new Promise<void>((resolve, reject) => {
    pipeline(nodeStream, response, (error) => {
      // The client closing the connection (e.g. dropping an SSE stream) is a normal outcome.
      if (!error || (error as NodeJS.ErrnoException).code === 'ERR_STREAM_PREMATURE_CLOSE') {
        resolve();
      } else {
        reject(error);
      }
    });
  });
}
