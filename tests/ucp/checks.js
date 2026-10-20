import assert from 'node:assert';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root = new URL('./schemas/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('manifest.json', root), 'utf8'));
const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats(ajv);

for (const [file, sha256] of Object.entries(manifest.files)) {
  const bytes = readFileSync(new URL(file, root));
  assert.equal(
    createHash('sha256').update(bytes).digest('hex'),
    sha256,
    `${file} differs from its manifest hash`,
  );
  ajv.addSchema(JSON.parse(bytes.toString('utf8')));
}

const ref = (path) => ({ $ref: `${manifest.source}${path}` });

const validators = {
  checkout: ajv.compile({
    allOf: [
      ref('shopping/fulfillment.json#/$defs/dev.ucp.shopping.checkout'),
      ref('shopping/discount.json#/$defs/dev.ucp.shopping.checkout'),
    ],
  }),
  order: ajv.compile(ref('shopping/order.json')),
  error: ajv.compile(ref('common/types/error_response.json')),
  businessProfile: ajv.compile(ref('profile.json#/$defs/business_schema')),
  platformProfile: ajv.compile(ref('profile.json#/$defs/platform_schema')),
};

export function assertValid(kind, body) {
  const validate = validators[kind];
  assert.ok(
    validate(body),
    `${kind}: ${ajv.errorsText(validate.errors)}\n${JSON.stringify(body, null, 2)}`,
  );
}

export function assertTotals(totals) {
  const total = totals.find(({ type }) => type === 'total').amount;
  const rest = totals
    .filter(({ type }) => type !== 'total')
    .reduce((sum, { amount }) => sum + amount, 0);
  assert.equal(rest, total, `totals do not add up: ${JSON.stringify(totals)}`);
  for (const entry of totals) {
    assert.ok(Number.isInteger(entry.amount), `${entry.type} is not an integer amount`);
    if (entry.lines) {
      assert.equal(
        entry.lines.reduce((sum, { amount }) => sum + amount, 0),
        entry.amount,
        `lines of ${entry.type} do not add up: ${JSON.stringify(entry.lines)}`,
      );
    }
  }
}

export function assertCheckout(body, { secrets = [] } = {}) {
  assertValid('checkout', body);
  assertTotals(body.totals);
  const open = !['completed', 'canceled'].includes(body.status);
  assert.equal(Boolean(body.continue_url), open, `continue_url for ${body.status}`);
  assert.equal(Boolean(body.order), body.status === 'completed', `order for ${body.status}`);
  assert.equal(body.actions, undefined);
  if (body.status === 'requires_escalation') {
    assert.ok(body.messages.some(({ severity }) => severity?.startsWith('requires_buyer')));
  }
  const serialized = JSON.stringify(body);
  for (const secret of secrets) assert.ok(!serialized.includes(secret), `${secret} is echoed`);
  return body;
}

export const messageCodes = (body) => (body.messages ?? []).map(({ code }) => code);
