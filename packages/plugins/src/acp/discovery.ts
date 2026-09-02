import { ACP_API_VERSION, getACPApiBaseUrl } from './config.ts';
import type { ACPRouteResult } from './idempotency.ts';

export const discoverACP = async (): Promise<ACPRouteResult> => ({
  status: 200,
  headers: { 'Cache-Control': 'public, max-age=3600' },
  body: {
    protocol: {
      name: 'acp',
      version: ACP_API_VERSION,
      supported_versions: [ACP_API_VERSION],
    },
    api_base_url: getACPApiBaseUrl(),
    transports: ['rest'],
    capabilities: {
      services: ['checkout'],
    },
  },
});

export const paymentHandlerConfigSchema = async (): Promise<ACPRouteResult> => ({
  status: 200,
  body: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'Unchained ACP payment handler configuration',
    type: 'object',
    required: ['merchant_id', 'psp'],
    properties: {
      merchant_id: { type: 'string', minLength: 1 },
      psp: { type: 'string', minLength: 1 },
    },
    additionalProperties: true,
  },
});

export const paymentInstrumentSchema = async (): Promise<ACPRouteResult> => ({
  status: 200,
  body: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'Unchained ACP delegated payment instrument',
    type: 'object',
    required: ['type', 'credential'],
    properties: {
      type: { type: 'string', minLength: 1 },
      credential: {
        type: 'object',
        required: ['type', 'token'],
        properties: {
          type: { type: 'string', minLength: 1 },
          token: { type: 'string', minLength: 1 },
        },
        additionalProperties: true,
      },
    },
    additionalProperties: true,
  },
});
