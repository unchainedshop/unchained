import { describe, it, before, after, mock } from 'node:test';
import assert from 'node:assert';
import { createServer, type Server } from 'node:http';
import { setTimeout as sleep } from 'node:timers/promises';
import {
  AuditLog,
  OCSF_CLASS,
  OCSF_SEVERITY,
  OCSF_STATUS,
  OCSF_AUTH_ACTIVITY,
  OCSF_ACCOUNT_ACTIVITY,
  OCSF_API_ACTIVITY,
  createAuditLog,
} from './index.ts';

const ORIGINAL_LOG_FORMAT = process.env.UNCHAINED_LOG_FORMAT;
const ORIGINAL_CONSOLE_LOG = console.log;

const restoreLogFormat = () => {
  if (ORIGINAL_LOG_FORMAT === undefined) delete process.env.UNCHAINED_LOG_FORMAT;
  else process.env.UNCHAINED_LOG_FORMAT = ORIGINAL_LOG_FORMAT;
};

/** Runs fn against a fresh emit-only AuditLog and returns the OCSF events it emitted. */
const captureEvents = async (fn: (auditLog: AuditLog) => Promise<void>): Promise<any[]> => {
  process.env.UNCHAINED_LOG_FORMAT = 'json';
  const events: any[] = [];
  console.log = mock.fn((line: any) => {
    try {
      const parsed = JSON.parse(line);
      if (parsed.ocsf) events.push(parsed.ocsf);
    } catch {
      // non-JSON output — ignore
    }
  });
  try {
    const auditLog = createAuditLog({});
    await fn(auditLog);
    await auditLog.close();
  } finally {
    console.log = ORIGINAL_CONSOLE_LOG;
    restoreLogFormat();
  }
  return events;
};

describe('AuditLog (OCSF Format)', () => {
  it('should emit an event and return its uid', async () => {
    let id: string | undefined;
    const [event] = await captureEvents(async (auditLog) => {
      id = await auditLog.logAuthentication({
        activity: OCSF_AUTH_ACTIVITY.LOGON,
        userId: 'user-123',
        success: true,
        remoteAddress: '192.168.1.1',
        sessionId: 'sess-abc',
      });
    });

    assert.match(id!, /^[0-9a-f-]{36}$/);
    assert.strictEqual(event.metadata.uid, id);
  });

  it('should build well-formed authentication events', async () => {
    const [event] = await captureEvents(async (auditLog) => {
      await auditLog.logAuthentication({
        activity: OCSF_AUTH_ACTIVITY.LOGON,
        userId: 'typed-user',
        userName: 'test@example.com',
        success: true,
        isMfa: true,
        remoteAddress: '10.0.0.1',
        sessionId: 'sess-1',
      });
    });

    assert.strictEqual(event.class_uid, OCSF_CLASS.AUTHENTICATION);
    assert.strictEqual(event.category_uid, 3);
    assert.strictEqual(event.type_uid, OCSF_CLASS.AUTHENTICATION * 100 + OCSF_AUTH_ACTIVITY.LOGON);
    assert.strictEqual(event.message, 'User Login');
    assert.strictEqual(event.status_id, OCSF_STATUS.SUCCESS);
    assert.strictEqual(event.severity_id, OCSF_SEVERITY.INFORMATIONAL);
    assert.strictEqual(event.is_mfa, true);
    assert.strictEqual(event.user.uid, 'typed-user');
    assert.strictEqual(event.user.email_addr, 'test@example.com');
    assert.strictEqual(event.src_endpoint.ip, '10.0.0.1');
    assert.strictEqual(event.session.uid, 'sess-1');
    // OCSF requires service or dst_endpoint on authentication events
    assert.ok(event.service?.name);
    assert.ok(event.time > 0);
    assert.strictEqual(event.metadata.version, '1.4.0');
  });

  it('should escalate severity and status for failures', async () => {
    const [event] = await captureEvents(async (auditLog) => {
      await auditLog.logAuthentication({
        activity: OCSF_AUTH_ACTIVITY.LOGON,
        success: false,
        message: 'Failed Login Attempt',
      });
    });

    assert.strictEqual(event.severity_id, OCSF_SEVERITY.HIGH);
    assert.strictEqual(event.status_id, OCSF_STATUS.FAILURE);
    assert.strictEqual(event.message, 'Failed Login Attempt');
  });

  it('should build account change events with actor', async () => {
    const [created, roleChange] = await captureEvents(async (auditLog) => {
      await auditLog.logAccountChange({
        activity: OCSF_ACCOUNT_ACTIVITY.CREATE,
        userId: 'test-user',
        success: true,
      });
      await auditLog.logAccountChange({
        activity: OCSF_ACCOUNT_ACTIVITY.ATTACH_POLICY,
        userId: 'target-user',
        userName: 'target@example.com',
        actorUserId: 'admin-user',
        actorUserName: 'admin@example.com',
        success: true,
      });
    });

    assert.strictEqual(created.class_uid, OCSF_CLASS.ACCOUNT_CHANGE);
    assert.strictEqual(created.activity_id, OCSF_ACCOUNT_ACTIVITY.CREATE);
    assert.strictEqual(created.message, 'User Created');
    assert.strictEqual(created.user.uid, 'test-user');

    assert.strictEqual(roleChange.message, 'User Roles Changed');
    assert.strictEqual(roleChange.user.uid, 'target-user');
    assert.strictEqual(roleChange.actor.user.uid, 'admin-user');
  });

  it('should build API activity events with request details', async () => {
    const [event] = await captureEvents(async (auditLog) => {
      await auditLog.logApiActivity({
        activity: OCSF_API_ACTIVITY.UPDATE,
        userId: 'payer-user',
        operation: 'processPayment',
        httpMethod: 'POST',
        path: '/api/payments',
        responseCode: 200,
        remoteAddress: '10.0.0.2',
        success: true,
        message: 'Payment Completed',
      });
    });

    assert.strictEqual(event.class_uid, OCSF_CLASS.API_ACTIVITY);
    assert.strictEqual(event.activity_id, OCSF_API_ACTIVITY.UPDATE);
    assert.strictEqual(event.activity_name, 'Update');
    assert.strictEqual(event.actor.user.uid, 'payer-user');
    assert.strictEqual(event.api.operation, 'processPayment');
    assert.strictEqual(event.api.response.code, 200);
    assert.strictEqual(event.http_request.http_method, 'POST');
    assert.strictEqual(event.http_request.url.path, '/api/payments');
    assert.strictEqual(event.src_endpoint.ip, '10.0.0.2');
  });

  it('should fall back to the engine host for system-originated API activity', async () => {
    const [event] = await captureEvents(async (auditLog) => {
      await auditLog.logApiActivity({
        activity: OCSF_API_ACTIVITY.CREATE,
        operation: 'createLanguage',
        success: true,
      });
    });

    // OCSF requires src_endpoint on API Activity events
    assert.ok(event.src_endpoint.hostname);
    assert.strictEqual(event.src_endpoint.ip, undefined);
  });

  it('should emit e-commerce activities as OCSF Other with activity_name', async () => {
    const [checkout, payment, denied] = await captureEvents(async (auditLog) => {
      await auditLog.logApiActivity({
        activity: OCSF_API_ACTIVITY.CHECKOUT,
        userId: 'checkout-user',
        success: true,
      });
      await auditLog.logApiActivity({
        activity: OCSF_API_ACTIVITY.PAYMENT,
        userId: 'payment-user',
        success: true,
      });
      await auditLog.logApiActivity({
        activity: OCSF_API_ACTIVITY.ACCESS_DENIED,
        userId: 'denied-user',
        success: false,
      });
    });

    // E-commerce identifiers are emitted as activity_id 99 (Other) per OCSF
    assert.strictEqual(checkout.activity_id, OCSF_API_ACTIVITY.OTHER);
    assert.strictEqual(checkout.activity_name, 'Checkout');
    assert.strictEqual(checkout.type_uid, OCSF_CLASS.API_ACTIVITY * 100 + OCSF_API_ACTIVITY.OTHER);
    assert.strictEqual(checkout.message, 'Order Checkout');

    assert.strictEqual(payment.activity_id, OCSF_API_ACTIVITY.OTHER);
    assert.strictEqual(payment.activity_name, 'Payment');
    assert.strictEqual(payment.message, 'Payment Processed');

    assert.strictEqual(denied.activity_id, OCSF_API_ACTIVITY.OTHER);
    assert.strictEqual(denied.activity_name, 'Access Denied');
    assert.strictEqual(denied.severity_id, OCSF_SEVERITY.HIGH);
  });

  it('should carry changed-field snapshots in unmapped.data', async () => {
    const [event] = await captureEvents(async (auditLog) => {
      await auditLog.logApiActivity({
        activity: OCSF_API_ACTIVITY.UPDATE,
        operation: 'updateProduct',
        success: true,
        data: { status: 'ACTIVE' },
      });
    });

    assert.deepStrictEqual(event.unmapped, { data: { status: 'ACTIVE' } });
  });
});

describe('OCSF Activity Constants', () => {
  it('should have standard authentication activities', () => {
    assert.strictEqual(OCSF_AUTH_ACTIVITY.LOGON, 1);
    assert.strictEqual(OCSF_AUTH_ACTIVITY.LOGOFF, 2);
    assert.strictEqual(OCSF_AUTH_ACTIVITY.OTHER, 99);
  });

  it('should have standard account activities', () => {
    assert.strictEqual(OCSF_ACCOUNT_ACTIVITY.CREATE, 1);
    assert.strictEqual(OCSF_ACCOUNT_ACTIVITY.PASSWORD_CHANGE, 3);
    assert.strictEqual(OCSF_ACCOUNT_ACTIVITY.PASSWORD_RESET, 4);
    assert.strictEqual(OCSF_ACCOUNT_ACTIVITY.DELETE, 6);
    assert.strictEqual(OCSF_ACCOUNT_ACTIVITY.ATTACH_POLICY, 7);
    assert.strictEqual(OCSF_ACCOUNT_ACTIVITY.MFA_ENABLE, 10);
    assert.strictEqual(OCSF_ACCOUNT_ACTIVITY.MFA_DISABLE, 11);
  });

  it('should have standard API activities', () => {
    assert.strictEqual(OCSF_API_ACTIVITY.CREATE, 1);
    assert.strictEqual(OCSF_API_ACTIVITY.READ, 2);
    assert.strictEqual(OCSF_API_ACTIVITY.UPDATE, 3);
    assert.strictEqual(OCSF_API_ACTIVITY.DELETE, 4);
    assert.strictEqual(OCSF_API_ACTIVITY.OTHER, 99);
  });

  it('should have internal e-commerce API activity identifiers', () => {
    assert.strictEqual(OCSF_API_ACTIVITY.CHECKOUT, 90);
    assert.strictEqual(OCSF_API_ACTIVITY.PAYMENT, 91);
    assert.strictEqual(OCSF_API_ACTIVITY.REFUND, 92);
    assert.strictEqual(OCSF_API_ACTIVITY.EXPORT, 93);
    assert.strictEqual(OCSF_API_ACTIVITY.IMPORT, 94);
    assert.strictEqual(OCSF_API_ACTIVITY.ACCESS_DENIED, 95);
  });
});

describe('OCSF Constants', () => {
  it('should have standard class UIDs', () => {
    assert.strictEqual(OCSF_CLASS.ACCOUNT_CHANGE, 3001);
    assert.strictEqual(OCSF_CLASS.AUTHENTICATION, 3002);
    assert.strictEqual(OCSF_CLASS.API_ACTIVITY, 6003);
  });

  it('should have standard severity levels', () => {
    assert.strictEqual(OCSF_SEVERITY.INFORMATIONAL, 1);
    assert.strictEqual(OCSF_SEVERITY.LOW, 2);
    assert.strictEqual(OCSF_SEVERITY.MEDIUM, 3);
    assert.strictEqual(OCSF_SEVERITY.HIGH, 4);
    assert.strictEqual(OCSF_SEVERITY.CRITICAL, 5);
  });

  it('should have standard status IDs', () => {
    assert.strictEqual(OCSF_STATUS.SUCCESS, 1);
    assert.strictEqual(OCSF_STATUS.FAILURE, 2);
  });
});

describe('AuditLog logger sink', () => {
  it('emits the full OCSF event as a structured JSON log line', async () => {
    process.env.UNCHAINED_LOG_FORMAT = 'json';
    const lines: string[] = [];
    console.log = mock.fn((line: any) => {
      lines.push(typeof line === 'string' ? line : JSON.stringify(line));
    });
    try {
      const auditLog = createAuditLog({});
      await auditLog.logAuthentication({
        activity: OCSF_AUTH_ACTIVITY.LOGON,
        userId: 'stdout-user',
        userName: 'stdout@example.com',
        success: true,
      });
      await auditLog.close();
    } finally {
      console.log = ORIGINAL_CONSOLE_LOG;
      restoreLogFormat();
    }

    const auditLines = lines
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter((parsed) => parsed?.name === 'unchained:audit' && parsed?.ocsf);
    assert.strictEqual(auditLines.length, 1);
    const parsed = auditLines[0];
    assert.strictEqual(parsed.level, 'INFO');
    assert.strictEqual(parsed.message, 'User Login');
    assert.strictEqual(parsed.ocsf.class_uid, OCSF_CLASS.AUTHENTICATION);
    assert.strictEqual(parsed.ocsf.user.uid, 'stdout-user');
  });

  it('emits nothing when log is disabled', async () => {
    process.env.UNCHAINED_LOG_FORMAT = 'json';
    const lines: string[] = [];
    console.log = mock.fn((line: any) => {
      lines.push(String(line));
    });
    try {
      const auditLog = createAuditLog({ log: false });
      await auditLog.logAuthentication({
        activity: OCSF_AUTH_ACTIVITY.LOGON,
        userId: 'silent-user',
        success: true,
      });
      await auditLog.close();
    } finally {
      console.log = ORIGINAL_CONSOLE_LOG;
      restoreLogFormat();
    }
    assert.strictEqual(lines.filter((line) => line.includes('unchained:audit')).length, 0);
  });
});

describe('AuditLog OTLP collector push', () => {
  let server: Server;
  let collectorUrl: string;
  let requests: { url: string; body: any }[] = [];
  let statusCode = 200;

  before(async () => {
    server = createServer((req, res) => {
      let raw = '';
      req.on('data', (chunk) => (raw += chunk));
      req.on('end', () => {
        requests.push({ url: req.url!, body: JSON.parse(raw) });
        res.statusCode = statusCode;
        res.setHeader('Content-Type', 'application/json');
        res.end('{}');
      });
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address() as { port: number };
    collectorUrl = `http://127.0.0.1:${port}/v1/logs`;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  const waitFor = async (condition: () => boolean, timeoutMs = 2000) => {
    const start = Date.now();
    while (!condition()) {
      if (Date.now() - start > timeoutMs) throw new Error('Timed out waiting for condition');
      await sleep(10);
    }
  };

  it('pushes OTLP resourceLogs once batchSize is reached', async () => {
    requests = [];
    statusCode = 200;
    const auditLog = createAuditLog({
      log: false,
      collectorUrl,
      batchSize: 2,
      flushIntervalMs: 60_000,
    });

    await auditLog.logAuthentication({
      activity: OCSF_AUTH_ACTIVITY.LOGON,
      userId: 'otlp-1',
      success: true,
    });
    assert.strictEqual(requests.length, 0);
    await auditLog.logAuthentication({
      activity: OCSF_AUTH_ACTIVITY.LOGON,
      userId: 'otlp-2',
      success: false,
    });
    await waitFor(() => requests.length === 1);

    const { url, body } = requests[0];
    assert.strictEqual(url, '/v1/logs');
    const serviceName = body.resourceLogs[0].resource.attributes.find(
      (attribute: any) => attribute.key === 'service.name',
    );
    assert.ok(serviceName.value.stringValue);
    const scopeLogs = body.resourceLogs[0].scopeLogs[0];
    assert.strictEqual(scopeLogs.scope.name, 'unchained:audit');
    const records = scopeLogs.logRecords;
    assert.strictEqual(records.length, 2);
    assert.match(records[0].timeUnixNano, /^\d+$/);
    assert.strictEqual(records[0].severityNumber, 9); // INFO
    assert.strictEqual(records[1].severityNumber, 17); // ERROR (failed login)
    const classUid = records[0].body.kvlistValue.values.find((entry: any) => entry.key === 'class_uid');
    assert.strictEqual(classUid.value.intValue, '3002');
    const userAttribute = records[0].attributes.find((attribute: any) => attribute.key === 'user.id');
    assert.strictEqual(userAttribute.value.stringValue, 'otlp-1');
    await auditLog.close();
  });

  it('flushes remaining events on close', async () => {
    requests = [];
    statusCode = 200;
    const auditLog = createAuditLog({
      log: false,
      collectorUrl,
      batchSize: 100,
      flushIntervalMs: 60_000,
    });
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.CHECKOUT,
      userId: 'close-user',
      success: true,
    });
    assert.strictEqual(requests.length, 0);
    await auditLog.close();
    assert.strictEqual(requests.length, 1);
    assert.strictEqual(requests[0].body.resourceLogs[0].scopeLogs[0].logRecords.length, 1);
  });

  it('re-queues events when the collector fails and retries on the next flush', async () => {
    requests = [];
    statusCode = 500;
    const auditLog = createAuditLog({
      log: false,
      collectorUrl,
      batchSize: 2,
      flushIntervalMs: 60_000,
    });
    await auditLog.logAuthentication({
      activity: OCSF_AUTH_ACTIVITY.LOGON,
      userId: 'retry-1',
      success: true,
    });
    await auditLog.logAuthentication({
      activity: OCSF_AUTH_ACTIVITY.LOGON,
      userId: 'retry-2',
      success: true,
    });
    await waitFor(() => requests.length === 1);
    await sleep(50); // allow the failed batch to be re-queued
    statusCode = 200;
    await auditLog.close();
    assert.strictEqual(requests.length, 2);
    assert.strictEqual(requests[1].body.resourceLogs[0].scopeLogs[0].logRecords.length, 2);
  });

  it('caps the queue and drops the oldest events', async () => {
    requests = [];
    statusCode = 200;
    const auditLog = createAuditLog({
      log: false,
      collectorUrl,
      batchSize: 100,
      flushIntervalMs: 60_000,
      maxQueueSize: 3,
    });
    for (let i = 1; i <= 5; i += 1) {
      await auditLog.logAuthentication({
        activity: OCSF_AUTH_ACTIVITY.LOGON,
        userId: `cap-${i}`,
        success: true,
      });
    }
    await auditLog.close();
    assert.strictEqual(requests.length, 1);
    const records = requests[0].body.resourceLogs[0].scopeLogs[0].logRecords;
    assert.strictEqual(records.length, 3);
    const userIds = records.map(
      (record: any) =>
        record.attributes.find((attribute: any) => attribute.key === 'user.id').value.stringValue,
    );
    assert.deepStrictEqual(userIds, ['cap-3', 'cap-4', 'cap-5']);
  });
});
