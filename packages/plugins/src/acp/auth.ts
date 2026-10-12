import { timingSafeStringEqual } from '@unchainedshop/utils';
import { ACP_API_VERSION, acpConfig } from './config.ts';
import { ACPError } from './error.ts';

const apiVersionError = (code: string, message: string) =>
  new ACPError(400, 'invalid_request', code, message, {
    param: '$.headers.API-Version',
    supportedVersions: [ACP_API_VERSION],
  });

const idempotencyKeyError = (code: string, message: string) =>
  new ACPError(400, 'invalid_request', code, message, { param: '$.headers.Idempotency-Key' });

export const verifyACPRequest = async (request: Request) => {
  const authorization = request.headers.get('authorization');
  const [scheme, token] = authorization?.split(' ') || [];
  if (
    scheme?.toLowerCase() !== 'bearer' ||
    !token ||
    !(await timingSafeStringEqual(token, acpConfig.apiKey!))
  ) {
    throw new ACPError(401, 'invalid_request', 'invalid_api_key', 'A valid Bearer token is required');
  }

  const apiVersion = request.headers.get('api-version');
  if (!apiVersion) throw apiVersionError('missing_api_version', 'API-Version is required');
  if (apiVersion !== ACP_API_VERSION) {
    throw apiVersionError(
      'unsupported_api_version',
      `Unsupported API-Version. Supported versions: ${ACP_API_VERSION}`,
    );
  }

  if (request.method === 'POST') {
    const idempotencyKey = request.headers.get('idempotency-key');
    if (!idempotencyKey) {
      throw idempotencyKeyError(
        'idempotency_key_required',
        'Idempotency-Key is required for POST requests',
      );
    }
    if (idempotencyKey.length > 255) {
      throw idempotencyKeyError(
        'invalid_idempotency_key',
        'Idempotency-Key cannot exceed 255 characters',
      );
    }
  }
};
