import { createLogger } from '@unchainedshop/logger';
import type { UnchainedCore } from '@unchainedshop/core';
import { timingSafeStringEqual } from '@unchainedshop/utils';

const logger = createLogger('unchained:minio');

const { MINIO_WEBHOOK_AUTH_TOKEN } = process.env;

const isAuthorized = async (authorization = ''): Promise<boolean> => {
  if (!MINIO_WEBHOOK_AUTH_TOKEN) return false;
  const [type, token] = authorization.split(' ');
  if (type !== 'Bearer' || !token) return false;
  // Use timing-safe comparison to prevent timing attacks
  return timingSafeStringEqual(token, MINIO_WEBHOOK_AUTH_TOKEN);
};

export async function minioWebhookHandler(request: Request, context: UnchainedCore): Promise<Response> {
  try {
    const authorization = request.headers.get('authorization') || '';

    if (!(await isAuthorized(authorization))) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { Records = [], EventName } = body;

    if (EventName === 's3:ObjectCreated:Put') {
      const [{ s3 }] = Records;
      const { object } = s3;
      const { size, contentType: type } = object;
      const [fileId] = object.key.split('.');

      await context.services.files.linkFile({ fileId, type, size });

      return new Response(null, { status: 200 });
    }

    return new Response(null, { status: 404 });
  } catch (e: any) {
    logger.error(e);
    return new Response(JSON.stringify({ name: e.name, code: e.code, message: e.message }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
