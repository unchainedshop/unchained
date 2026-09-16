import assert from 'node:assert/strict';
import { it } from 'node:test';
import { gridfsRouteHandler } from './api.ts';

it('allows upload preflights with tracing headers and varies the response by requested headers', async () => {
  for (const requestedHeaders of ['content-type, traceparent, tracestate', undefined]) {
    const response = await gridfsRouteHandler(
      new Request('https://shop.example/gridfs/uploads/photo.jpg', {
        method: 'OPTIONS',
        headers: requestedHeaders ? { 'Access-Control-Request-Headers': requestedHeaders } : {},
      }),
      { params: { directoryName: 'uploads', fileName: 'photo.jpg' } } as any,
    );
    assert.equal(response.status, 200);
    assert.equal(
      response.headers.get('Access-Control-Allow-Headers'),
      requestedHeaders || 'Content-Type',
    );
    assert.equal(response.headers.get('Vary'), 'Access-Control-Request-Headers');
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
  }
});
