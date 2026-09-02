import { timingSafeStringEqual } from '@unchainedshop/utils';
import { ACP_API_VERSION, acpConfig } from './config.ts';
import { ACPError } from './error.ts';

// Inbound auth for ACP requests. Bearer is the only hard MUST in the spec; the
// request signature is a SHOULD and intentionally not enforced in this version.
export const verifyACPRequest = async (request: Request) => {
  if (!acpConfig.apiKey) {
    throw new ACPError(
      503,
      'api_error',
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
    throw new ACPError(
      401,
      'invalid_api_key_error',
      'invalid_api_key',
      'A valid Bearer token is required',
    );
  }

  const apiVersion = request.headers.get('api-version');
  if (!apiVersion) {
    throw new ACPError(
      400,
      'invalid_request',
      'missing_api_version',
      `API-Version is required. Supported versions: ${ACP_API_VERSION}`,
      '$.headers.API-Version',
    );
  }
  if (apiVersion !== ACP_API_VERSION) {
    throw new ACPError(
      400,
      'invalid_request',
      'unsupported_api_version',
      `Unsupported API-Version. Supported versions: ${ACP_API_VERSION}`,
      '$.headers.API-Version',
    );
  }

  if (request.method === 'POST' && !request.headers.get('idempotency-key')) {
    throw new ACPError(
      400,
      'invalid_request',
      'idempotency_key_required',
      'Idempotency-Key is required for POST requests',
      '$.headers.Idempotency-Key',
    );
  }
};
