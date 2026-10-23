import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

// Run the real parser in a child: a regression must fail without hanging the
// test runner inside append-field's synchronous sparse-array conversion.
const worker = `
  import { Readable } from 'node:stream';
  const { default: createParser } = await import(process.argv[1]);
  const scenario = process.argv[2];
  const boundary = 'temp-upload-regression';
  const fields = scenario === 'oversized'
    ? [['items[4294967294]', 'x'], ['items[key]', 'y']]
    : scenario === 'boundary'
      ? [['items[100]', 'ordinary']]
      : [['note', 'ordinary']];
  const parts = fields.map(([name, value]) =>
    '--' + boundary + '\\r\\nContent-Disposition: form-data; name="' + name + '"\\r\\n\\r\\n' + value + '\\r\\n');
  if (scenario === 'file') parts.push(
    '--' + boundary + '\\r\\nContent-Disposition: form-data; name="file"; filename="fixture.txt"\\r\\nContent-Type: text/plain\\r\\n\\r\\nfixture\\r\\n');
  const body = Buffer.from(parts.join('') + '--' + boundary + '--\\r\\n');
  const req = Readable.from([body]);
  req.headers = {
    'content-type': 'multipart/form-data; boundary=' + boundary,
    'content-length': String(body.length),
  };
  req.method = 'POST';
  createParser().any()(req, {}, error => console.log(JSON.stringify({
    error: error?.code || null,
    note: req.body?.note,
    boundaryValue: req.body?.items?.[100],
    file: req.files?.[0]?.originalname,
    contents: req.files?.[0]?.buffer.toString(),
  })));
`;

function parse(scenario: string) {
  const result = spawnSync(process.execPath, [
    '--no-warnings', '--max-old-space-size=128', '--input-type=module',
    '--eval', worker, new URL('./createTempUploadParser.ts', import.meta.url).href, scenario,
  ], { encoding: 'utf8', timeout: 2000 });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

test('rejects oversized multipart array indexes before sparse-array conversion', () => {
  assert.equal(parse('oversized').error, 'LIMIT_FIELD_ARRAY_INDEX');
});

test('accepts ordinary text fields and the maximum supported array index', () => {
  assert.deepEqual(parse('ordinary'), { error: null, note: 'ordinary' });
  assert.deepEqual(parse('boundary'), { error: null, boundaryValue: 'ordinary' });
});

test('preserves normal in-memory file uploads', () => {
  assert.deepEqual(parse('file'), {
    error: null, note: 'ordinary', file: 'fixture.txt', contents: 'fixture',
  });
});
