import { describe, it } from 'node:test';
import assert from 'node:assert';
import { z } from 'zod/v4-mini';
import {
  createManagementSchemaFromValidators,
  createMcpErrorResponse,
  createMcpResponse,
} from './sharedSchemas.ts';

describe('createManagementSchemaFromValidators', () => {
  const actionValidators = {
    GET: z.object({
      id: z.string().check(z.minLength(1), z.describe('Entity ID')),
    }),
    LIST: z.object({
      limit: z
        .optional(z.int().check(z.gte(1)))
        .check(z.describe('Maximum number of results to return')),
    }),
  };
  const schema = createManagementSchemaFromValidators(actionValidators);

  it('carries the Standard Schema jsonSchema provider the MCP SDK looks for', () => {
    // Without it the SDK falls back to converting with its own zod copy and
    // emits a console.warn that bypasses the structured logger.
    const standard = (schema as any)['~standard'];
    assert.strictEqual(standard.vendor, 'zod');
    assert.strictEqual(typeof standard.jsonSchema?.input, 'function');
    assert.strictEqual(typeof standard.jsonSchema?.output, 'function');
  });

  it('emits the action enum, optionality and descriptions in the wire JSON schema', () => {
    const jsonSchema = (schema as any)['~standard'].jsonSchema.input({ target: 'draft-2020-12' });
    assert.deepStrictEqual(jsonSchema.properties.action.enum, ['GET', 'LIST']);
    assert.deepStrictEqual(jsonSchema.required, ['action']);
    assert.strictEqual(jsonSchema.properties.id.description, 'Entity ID');
    assert.strictEqual(jsonSchema.properties.limit.description, 'Maximum number of results to return');
  });

  it('validates payloads through the Standard Schema validate contract', async () => {
    const standard = (schema as any)['~standard'];
    const valid = await standard.validate({ action: 'GET', id: 'abc' });
    assert.strictEqual(valid.issues, undefined);
    assert.deepStrictEqual(valid.value, { action: 'GET', id: 'abc' });
    const invalid = await standard.validate({ action: 'NOT_AN_ACTION' });
    assert.ok(invalid.issues.length > 0);
  });
});

describe('createMcpErrorResponse', () => {
  it('flags the result as an error', () => {
    // Without isError a failed tool call is indistinguishable from a successful one: the failure
    // only appears as prose inside the text content, so a client has to string match to notice
    // that nothing happened.
    const response = createMcpErrorResponse('remove_option', new Error('boom'));
    assert.strictEqual(response.isError, true);
  });

  it('keeps the message readable', () => {
    const response = createMcpErrorResponse('GET', new Error('missing filterId'));
    assert.strictEqual(response.content[0].text, 'Error in get: missing filterId');
  });

  it('does not flag a successful result', () => {
    assert.strictEqual((createMcpResponse({ ok: true }) as any).isError, undefined);
  });
});
