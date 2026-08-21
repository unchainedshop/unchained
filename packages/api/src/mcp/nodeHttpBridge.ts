import type { IncomingMessage, ServerResponse } from 'node:http';
import { Readable, pipeline } from 'node:stream';

// Minimal Node <-> web-standard HTTP bridge for the MCP handler. Owning these lines
// keeps @modelcontextprotocol/node (and its hono peer dependency) out of the dependency tree.

export function toWebRequest(req: IncomingMessage, res: ServerResponse, bodyText?: string): Request {
  const controller = new AbortController();
  // Client hang-up must cancel the in-flight MCP exchange. The signal for that is the
  // RESPONSE closing before it finished — the request stream's 'close' is useless here:
  // it fires on normal completion as soon as the body was consumed, which the framework's
  // body parser already did before this bridge runs.
  res.once('close', () => {
    if (!res.writableFinished) controller.abort();
  });

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const entry of value) headers.append(key, entry);
    } else if (value != null) {
      headers.set(key, value);
    }
  }
  // Bodies arrive pre-parsed by the framework (express.json / fastify's parser) and are
  // re-serialized to a string, so the original content-length no longer applies.
  if (bodyText !== undefined) headers.delete('content-length');

  // A malformed (client-controlled) Host header must not throw before the auth wall —
  // fall back so the handler can still answer based on auth state alone.
  let url: URL;
  try {
    url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  } catch {
    try {
      url = new URL(req.url || '/', 'http://localhost');
    } catch {
      url = new URL('http://localhost/');
    }
  }

  return new Request(url, {
    method: req.method,
    headers,
    body: bodyText,
    signal: controller.signal,
  });
}

export async function sendWebResponse(res: ServerResponse, response: Response): Promise<void> {
  if (res.destroyed || res.writableEnded) {
    // The client is already gone — release the response stream and settle.
    await response.body?.cancel().catch(() => undefined);
    return;
  }

  const headers: Record<string, string | string[]> = {};
  response.headers.forEach((value, key) => {
    headers[key] = key === 'set-cookie' ? response.headers.getSetCookie() : value;
  });
  res.writeHead(response.status, headers);

  if (!response.body) {
    res.end();
    return;
  }

  const nodeStream = Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]);
  await new Promise<void>((resolve, reject) => {
    pipeline(nodeStream, res, (error) => {
      // The client closing the connection (e.g. dropping an SSE stream) is a normal outcome.
      if (!error || (error as NodeJS.ErrnoException).code === 'ERR_STREAM_PREMATURE_CLOSE') {
        resolve();
      } else {
        reject(error);
      }
    });
  });
}
