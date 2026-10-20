export const UCP_VERSION = '2026-08-25';

const SPEC = `https://ucp.dev/${UCP_VERSION}`;

export const CHECKOUT = 'dev.ucp.shopping.checkout';
export const FULFILLMENT = 'dev.ucp.shopping.fulfillment';
export const DISCOUNT = 'dev.ucp.shopping.discount';
export const ORDER = 'dev.ucp.shopping.order';

const CAPABILITIES = [
  { name: CHECKOUT, spec: 'shopping/checkout', schema: 'shopping/checkout.json' },
  {
    name: FULFILLMENT,
    extends: CHECKOUT,
    spec: 'shopping/extensions/fulfillment',
    schema: 'shopping/fulfillment.json',
  },
  {
    name: DISCOUNT,
    extends: CHECKOUT,
    spec: 'shopping/extensions/discount',
    schema: 'shopping/discount.json',
  },
  { name: ORDER, spec: 'shopping/order', schema: 'shopping/order.json' },
];

export const profileCapabilities = () =>
  Object.fromEntries(
    CAPABILITIES.map(({ name, extends: parent, spec, schema }) => [
      name,
      [
        {
          version: UCP_VERSION,
          spec: `${SPEC}/specification/${spec}`,
          schema: `${SPEC}/schemas/${schema}`,
          ...(parent && { extends: parent }),
        },
      ],
    ]),
  );

export const profileServices = (endpoint: string) => ({
  'dev.ucp.shopping': [
    {
      version: UCP_VERSION,
      spec: `${SPEC}/specification/overview`,
      transport: 'rest',
      endpoint,
      schema: `${SPEC}/services/shopping/rest.openapi.json`,
    },
  ],
});

export function negotiate(platformCapabilities: Record<string, { version?: string }[]> = {}) {
  let active = CAPABILITIES.filter(({ name }) =>
    platformCapabilities[name]?.some(({ version }) => version === UCP_VERSION),
  );
  for (;;) {
    const kept = active.filter(
      ({ extends: parent }) => !parent || active.some(({ name }) => name === parent),
    );
    if (kept.length === active.length) return new Set(kept.map(({ name }) => name));
    active = kept;
  }
}

export const responseCapabilities = (active: Set<string>, root: string) =>
  Object.fromEntries(
    CAPABILITIES.filter(
      ({ name, extends: parent }) => active.has(name) && (name === root || parent === root),
    ).map(({ name }) => [name, [{ version: UCP_VERSION }]]),
  );

export const ucpError = (code: string, content: string) => new Error(content, { cause: code });

const PROTOCOL_ERRORS: Record<string, number> = {
  invalid_request: 400,
  invalid_profile_url: 400,
  digest_mismatch: 400,
  algorithm_unsupported: 400,
  unauthorized: 401,
  signature_missing: 401,
  signature_invalid: 401,
  key_not_found: 401,
  profile_not_trusted: 403,
  idempotency_conflict: 409,
  request_in_progress: 409,
  payload_too_large: 413,
  profile_malformed: 422,
  version_unsupported: 422,
  profile_unreachable: 424,
  idempotency_unavailable: 503,
};

export function protocolErrorResponse(error: Error) {
  const code = error.cause === 'LOCKED' ? 'request_in_progress' : (error.cause as string);
  const status = PROTOCOL_ERRORS[code];
  if (!status) return null;
  return Response.json(
    { code, content: error.cause === 'LOCKED' ? 'The checkout is being processed' : error.message },
    { status, headers: code === 'request_in_progress' || status === 503 ? { 'retry-after': '1' } : {} },
  );
}

export interface StructuredMember {
  value: unknown;
  params: [string, unknown][];
}

export function parseDictionary(input: string) {
  const members = new Map<string, StructuredMember>();
  let index = 0;
  const fail = (): never => {
    throw ucpError('invalid_request', `Invalid structured header: ${input}`);
  };
  const skipSpaces = () => {
    while (input[index] === ' ' || input[index] === '\t') index += 1;
  };
  const take = (pattern: RegExp) => {
    const [matched] = pattern.exec(input.slice(index)) ?? fail();
    index += matched.length;
    return matched;
  };
  const bareItem = (): unknown => {
    if (input[index] === '"') {
      let value = '';
      index += 1;
      while (input[index] !== '"') {
        if (index >= input.length) fail();
        if (input[index] === '\\') index += 1;
        value += input[index];
        index += 1;
      }
      index += 1;
      return value;
    }
    if (input[index] === ':') return Buffer.from(take(/^:[A-Za-z0-9+/=]*:/).slice(1, -1), 'base64');
    if (input[index] === '?') return take(/^\?[01]/) === '?1';
    if (/[-\d]/.test(input[index])) return Number(take(/^-?\d+(\.\d+)?/));
    return take(/^[A-Za-z*][\w:/!#$%&'*+.^`|~-]*/);
  };
  const params = () => {
    const list: [string, unknown][] = [];
    while (input[index] === ';') {
      index += 1;
      skipSpaces();
      const key = take(/^[a-z*][a-z0-9_.*-]*/);
      let value: unknown = true;
      if (input[index] === '=') {
        index += 1;
        value = bareItem();
      }
      list.push([key, value]);
    }
    return list;
  };

  skipSpaces();
  while (index < input.length) {
    const key = take(/^[a-z*][a-z0-9_.*-]*/);
    let value: unknown = true;
    if (input[index] === '=') {
      index += 1;
      if (input[index] === '(') {
        const items: unknown[] = [];
        index += 1;
        skipSpaces();
        while (input[index] !== ')') {
          if (index >= input.length) fail();
          items.push(bareItem());
          params();
          skipSpaces();
        }
        index += 1;
        value = items;
      } else {
        value = bareItem();
      }
    }
    members.set(key, { value, params: params() });
    skipSpaces();
    if (index < input.length) {
      if (input[index] !== ',') fail();
      index += 1;
      skipSpaces();
    }
  }
  return members;
}

export function parseAgentProfile(header: string | null) {
  let profile: unknown;
  try {
    profile = parseDictionary(header ?? '').get('profile')?.value;
  } catch {
    profile = null;
  }
  if (typeof profile === 'string' && URL.canParse(profile)) return profile;
  throw ucpError('invalid_profile_url', 'The UCP-Agent header must carry the platform profile URL');
}
