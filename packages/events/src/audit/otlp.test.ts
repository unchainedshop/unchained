import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert';
import {
  toAnyValue,
  encodeOCSFLogRecord,
  buildExportLogsRequest,
  parseOtlpHeaders,
  resolveCollectorUrl,
  resolveCollectorHeaders,
} from './otlp.ts';
import {
  OCSF_CLASS,
  OCSF_CATEGORY,
  OCSF_SEVERITY,
  OCSF_STATUS,
  OCSF_AUTH_ACTIVITY,
  OCSF_API_ACTIVITY,
  type OCSFAuthenticationEvent,
  type OCSFApiActivityEvent,
} from './ocsf-types.ts';

const OTEL_ENV_VARS = [
  'OTEL_EXPORTER_OTLP_ENDPOINT',
  'OTEL_EXPORTER_OTLP_LOGS_ENDPOINT',
  'OTEL_EXPORTER_OTLP_HEADERS',
  'OTEL_EXPORTER_OTLP_LOGS_HEADERS',
  'OTEL_SERVICE_NAME',
];

const buildAuthenticationEvent = (): OCSFAuthenticationEvent => ({
  category_uid: OCSF_CATEGORY.IDENTITY_ACCESS_MGMT,
  class_uid: OCSF_CLASS.AUTHENTICATION,
  type_uid: OCSF_CLASS.AUTHENTICATION * 100 + OCSF_AUTH_ACTIVITY.LOGON,
  activity_id: OCSF_AUTH_ACTIVITY.LOGON,
  severity_id: OCSF_SEVERITY.INFORMATIONAL,
  status_id: OCSF_STATUS.SUCCESS,
  time: 1700000000000,
  message: 'User Login',
  metadata: {
    version: '1.4.0',
    product: { name: 'Unchained Engine', version: '4.5' },
    uid: 'uid-auth-1',
  },
  user: { uid: 'user-1', name: 'user@example.com', email_addr: 'user@example.com' },
  src_endpoint: { ip: '10.0.0.9' },
  session: { uid: 'sess-1' },
});

const buildApiActivityEvent = (): OCSFApiActivityEvent => ({
  category_uid: OCSF_CATEGORY.APPLICATION_ACTIVITY,
  class_uid: OCSF_CLASS.API_ACTIVITY,
  type_uid: OCSF_CLASS.API_ACTIVITY * 100 + OCSF_API_ACTIVITY.OTHER,
  activity_id: OCSF_API_ACTIVITY.OTHER,
  activity_name: 'Checkout',
  severity_id: OCSF_SEVERITY.HIGH,
  status_id: OCSF_STATUS.FAILURE,
  time: 1700000001234,
  message: 'Order Checkout',
  metadata: {
    version: '1.4.0',
    product: { name: 'Unchained Engine', version: '4.5' },
    uid: 'uid-api-1',
  },
  actor: { user: { uid: 'actor-1', name: 'actor@example.com' }, session: { uid: 'sess-2' } },
  api: { operation: 'checkoutCart' },
});

describe('OTLP encoder', () => {
  afterEach(() => {
    for (const key of OTEL_ENV_VARS) delete process.env[key];
  });

  it('converts primitives, arrays and objects to AnyValue', () => {
    assert.deepStrictEqual(toAnyValue('a'), { stringValue: 'a' });
    assert.deepStrictEqual(toAnyValue(true), { boolValue: true });
    assert.deepStrictEqual(toAnyValue(42), { intValue: '42' });
    assert.deepStrictEqual(toAnyValue(1.5), { doubleValue: 1.5 });
    assert.deepStrictEqual(toAnyValue([1, 'b']), {
      arrayValue: { values: [{ intValue: '1' }, { stringValue: 'b' }] },
    });
    assert.deepStrictEqual(toAnyValue({ a: 1, skipped: undefined }), {
      kvlistValue: { values: [{ key: 'a', value: { intValue: '1' } }] },
    });
  });

  it('maps OCSF time and severity to OTLP fields', () => {
    const record = encodeOCSFLogRecord(buildAuthenticationEvent(), 1700000005000);
    assert.strictEqual(record.timeUnixNano, '1700000000000000000');
    assert.strictEqual(record.observedTimeUnixNano, '1700000005000000000');
    assert.strictEqual(record.severityNumber, 9);
    assert.strictEqual(record.severityText, 'Informational');

    const failed = encodeOCSFLogRecord(buildApiActivityEvent(), 1700000005000);
    assert.strictEqual(failed.severityNumber, 17);
    assert.strictEqual(failed.severityText, 'High');
  });

  it('carries the full OCSF event as a kvlist body', () => {
    const record = encodeOCSFLogRecord(buildAuthenticationEvent(), 1700000005000);
    assert.ok('kvlistValue' in record.body);
    const entries = (record.body as any).kvlistValue.values;
    const byKey = Object.fromEntries(entries.map((entry: any) => [entry.key, entry.value]));
    assert.deepStrictEqual(byKey.class_uid, { intValue: '3002' });
    assert.deepStrictEqual(byKey.message, { stringValue: 'User Login' });
    const userEntries = byKey.user.kvlistValue.values;
    assert.deepStrictEqual(
      userEntries.find((entry: any) => entry.key === 'uid'),
      { key: 'uid', value: { stringValue: 'user-1' } },
    );
  });

  it('extracts attributes from authentication and api activity events', () => {
    const authRecord = encodeOCSFLogRecord(buildAuthenticationEvent(), 1700000005000);
    const authAttributes = Object.fromEntries(
      authRecord.attributes.map(({ key, value }) => [key, value]),
    );
    assert.deepStrictEqual(authAttributes['ocsf.class_uid'], { intValue: '3002' });
    assert.deepStrictEqual(authAttributes['user.id'], { stringValue: 'user-1' });
    assert.deepStrictEqual(authAttributes['client.address'], { stringValue: '10.0.0.9' });
    assert.deepStrictEqual(authAttributes['session.id'], { stringValue: 'sess-1' });
    assert.deepStrictEqual(authAttributes['log.record.uid'], { stringValue: 'uid-auth-1' });

    const apiRecord = encodeOCSFLogRecord(buildApiActivityEvent(), 1700000005000);
    const apiAttributes = Object.fromEntries(apiRecord.attributes.map(({ key, value }) => [key, value]));
    assert.deepStrictEqual(apiAttributes['user.id'], { stringValue: 'actor-1' });
    assert.deepStrictEqual(apiAttributes['session.id'], { stringValue: 'sess-2' });
    assert.deepStrictEqual(apiAttributes['ocsf.api.operation'], { stringValue: 'checkoutCart' });
  });

  it('builds an export request with resource and scope', () => {
    process.env.OTEL_SERVICE_NAME = 'my-shop';
    const request = buildExportLogsRequest([buildAuthenticationEvent()], 1700000005000);
    assert.strictEqual(request.resourceLogs.length, 1);
    const { resource, scopeLogs } = request.resourceLogs[0];
    assert.deepStrictEqual(
      resource.attributes.find((attribute) => attribute.key === 'service.name'),
      { key: 'service.name', value: { stringValue: 'my-shop' } },
    );
    assert.strictEqual(scopeLogs[0].scope.name, 'unchained:audit');
    assert.strictEqual(scopeLogs[0].logRecords.length, 1);
  });

  it('parses OTLP header strings', () => {
    assert.deepStrictEqual(parseOtlpHeaders('Authorization=Bearer%20abc, X-Tenant=shop1'), {
      Authorization: 'Bearer abc',
      'X-Tenant': 'shop1',
    });
    assert.deepStrictEqual(parseOtlpHeaders(undefined), {});
    assert.deepStrictEqual(parseOtlpHeaders('malformed'), {});
  });

  it('resolves the collector url from config and env', () => {
    assert.strictEqual(
      resolveCollectorUrl('http://explicit:4318/v1/logs'),
      'http://explicit:4318/v1/logs',
    );
    assert.strictEqual(resolveCollectorUrl(), undefined);

    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'http://collector:4318/';
    assert.strictEqual(resolveCollectorUrl(), 'http://collector:4318/v1/logs');

    process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT = 'http://logs-collector:4318/v1/logs';
    assert.strictEqual(resolveCollectorUrl(), 'http://logs-collector:4318/v1/logs');

    assert.strictEqual(
      resolveCollectorUrl('http://explicit:4318/v1/logs'),
      'http://explicit:4318/v1/logs',
    );
  });

  it('merges collector headers with env fallbacks', () => {
    process.env.OTEL_EXPORTER_OTLP_HEADERS = 'A=1,B=2';
    process.env.OTEL_EXPORTER_OTLP_LOGS_HEADERS = 'B=3';
    assert.deepStrictEqual(resolveCollectorHeaders({ C: '4' }), { A: '1', B: '3', C: '4' });
  });
});
