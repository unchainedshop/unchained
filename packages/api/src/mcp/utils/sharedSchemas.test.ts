import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createMcpErrorResponse, createMcpResponse } from './sharedSchemas.ts';

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
