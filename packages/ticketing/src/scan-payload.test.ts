import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildTicketScanPayload, parseTicketScanPayload } from './scan-payload.ts';

const tokenId = '64f1c2a9e4b0a1b2c3d4e5f6';
const accessKey = 'a1b2c3';

test('the canonical payload is the ticket URL with the access key as hash', () => {
  assert.equal(
    buildTicketScanPayload({ tokenId, accessKey }, { baseUrl: 'https://shop.example/download' }),
    `https://shop.example/download/${tokenId}?hash=${accessKey}`,
  );
  assert.equal(
    buildTicketScanPayload({ tokenId, accessKey }, { baseUrl: 'https://shop.example/tickets/' }),
    `https://shop.example/tickets/${tokenId}?hash=${accessKey}`,
  );
});

test('the canonical payload parses back to the ticket and its access key', () => {
  const payload = buildTicketScanPayload({ tokenId, accessKey }, { baseUrl: 'https://shop.example/t' });
  assert.deepEqual(parseTicketScanPayload(payload), { tokenId, accessKey });
});

test('legacy wallet and PDF payloads are understood', () => {
  for (const text of [
    `https://theater.example/download/${tokenId}?hash=${accessKey}`,
    `https://theater.example/rest/apple-wallet/download/${tokenId}.pkpass?hash=${accessKey}`,
    `unchained-scanner://${tokenId}?hash=${accessKey}`,
    `unchained://ticket/${tokenId}?hash=${accessKey}`,
    `  unchained://ticket/${tokenId}/?hash=${accessKey}\n`,
  ]) {
    assert.deepEqual(parseTicketScanPayload(text), { tokenId, accessKey }, text);
  }
});

test('custom scheme ids keep their case', () => {
  assert.deepEqual(parseTicketScanPayload('unchained-scanner://Ticket-A1?hash=k'), {
    tokenId: 'Ticket-A1',
    accessKey: 'k',
  });
});

test('bare ids and payloads without a hash give no access key', () => {
  assert.deepEqual(parseTicketScanPayload(tokenId), { tokenId });
  assert.deepEqual(parseTicketScanPayload(` ${tokenId} `), { tokenId });
  assert.deepEqual(parseTicketScanPayload(`https://shop.example/download/${tokenId}`), { tokenId });
  assert.deepEqual(parseTicketScanPayload(`unchained-scanner://${tokenId}`), { tokenId });
});

test('anything else is not a ticket', () => {
  for (const text of [
    '',
    '   ',
    'https://shop.example/?hash=abc',
    'https://shop.example',
    'mailto:someone@example.com',
    'two words',
    'https://shop.example/download/%3Cscript%3E?hash=x',
    'not a url://',
  ]) {
    assert.equal(parseTicketScanPayload(text), null, JSON.stringify(text));
  }
});

test('the payload helpers stay free of node imports so the admin plugin can bundle them', async () => {
  const source = await readFile(new URL('./scan-payload.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /^\s*import\s/m);
});
