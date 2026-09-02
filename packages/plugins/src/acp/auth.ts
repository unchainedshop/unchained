import { timingSafeStringEqual } from '@unchainedshop/utils';
import { ACP_API_VERSION, acpConfig } from './config.ts';
import { ACPError } from './error.ts';

// Inbound auth for ACP requests. Bearer is the only hard MUST in the spec; the
// request signature is a SHOULD and intentionally not enforced in this version.
export const verifyACPRequest = async (request: Request) => {
  if (!acpConfig.apiKey) {
    throw new ACPError(
      503,
      'service_unavailable',
      'acp_not_configured',
      'UNCHAINED_ACP_API_KEY is not configured',
    );
  }

  const authorization = request.headers.get('authorization');
  const [scheme, token] = authorization?.split(' ') || [];
  if (
    scheme?.toLowerCase() !== 'bearer' ||
    !token ||
    !(await timingSafeStringEqual(token, acpConfig.apiKey))
  ) {
    throw new ACPError(401, 'invalid_request', 'invalid_api_key', 'A valid Bearer token is required');
  }

  const apiVersion = request.headers.get('api-version');
  if (!apiVersion) {
    throw new ACPError(400, 'invalid_request', 'missing_api_version', 'API-Version is required', {
      param: '$.headers.API-Version',
      supportedVersions: [ACP_API_VERSION],
    });
  }
  if (apiVersion !== ACP_API_VERSION) {
    throw ACPError.unsupportedVersion(`Unsupported API-Version. Supported versions: ${ACP_API_VERSION}`);
  }

  if (request.method === 'POST') {
    const idempotencyKey = request.headers.get('idempotency-key');
    if (!idempotencyKey) {
      throw new ACPError(
        400,
        'invalid_request',
        'idempotency_key_required',
        'Idempotency-Key is required for POST requests',
        { param: '$.headers.Idempotency-Key' },
      );
    }
    if (idempotencyKey.length > 255) {
      throw new ACPError(
        400,
        'invalid_request',
        'invalid_idempotency_key',
        'Idempotency-Key cannot exceed 255 characters',
        { param: '$.headers.Idempotency-Key' },
      );
    }
  }
};
