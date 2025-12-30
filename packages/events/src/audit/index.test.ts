import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { rm, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  AuditLog,
  OCSF_CLASS,
  OCSF_SEVERITY,
  OCSF_STATUS,
  OCSF_AUTH_ACTIVITY,
  OCSF_ACCOUNT_ACTIVITY,
  OCSF_API_ACTIVITY,
  createAuditLog,
  type OCSFAuthenticationEvent,
} from './index.ts';

const testDir = join(tmpdir(), `audit-test-${Date.now()}`);

describe('AuditLog (OCSF Format)', () => {
  let auditLog: AuditLog;

  before(async () => {
    await mkdir(testDir, { recursive: true });
    auditLog = createAuditLog(testDir);
  });

  after(async () => {
    await auditLog.close();
    await rm(testDir, { recursive: true, force: true });
  });

  it('should append a log entry and return an id', async () => {
    const id = await auditLog.logAuthentication({
      activity: OCSF_AUTH_ACTIVITY.LOGON,
      userId: 'user-123',
      success: true,
      remoteAddress: '192.168.1.1',
      sessionId: 'sess-abc',
    });

    assert.ok(id);
    assert.match(id, /^[0-9a-f-]{36}$/);
  });

  it('should write in JSON Lines format', async () => {
    await auditLog.logAccountChange({
      activity: OCSF_ACCOUNT_ACTIVITY.CREATE,
      userId: 'test-user',
      success: true,
    });

    // Read the file and check format
    const date = new Date().toISOString().slice(0, 10);
    const content = await readFile(join(testDir, `audit-${date}.jsonl`), 'utf-8');
    const lines = content.trim().split('\n');
    const lastLine = lines[lines.length - 1];

    // Parse as JSON
    const event = JSON.parse(lastLine);

    // OCSF Account Change class for CREATE
    assert.strictEqual(event.class_uid, OCSF_CLASS.ACCOUNT_CHANGE);
    assert.strictEqual(event.category_uid, 3); // Identity & Access Management
    assert.strictEqual(event.activity_id, OCSF_ACCOUNT_ACTIVITY.CREATE);
    assert.strictEqual(event.message, 'User Created');
    assert.strictEqual(event.user?.uid, 'test-user');
    assert.strictEqual(event.status_id, OCSF_STATUS.SUCCESS);
  });

  it('should use typed authentication logging', async () => {
    await auditLog.logAuthentication({
      activity: OCSF_AUTH_ACTIVITY.LOGON,
      userId: 'typed-user',
      userName: 'test@example.com',
      success: true,
      isMfa: true,
      remoteAddress: '10.0.0.1',
    });

    const entries = await auditLog.find({
      classUids: [OCSF_CLASS.AUTHENTICATION],
      userId: 'typed-user',
      limit: 1,
    });

    assert.ok(entries.length >= 1);
    const event = entries[0] as OCSFAuthenticationEvent;
    assert.strictEqual(event.class_uid, OCSF_CLASS.AUTHENTICATION);
    assert.strictEqual(event.is_mfa, true);
    assert.strictEqual(event.user?.uid, 'typed-user');
    assert.strictEqual(event.user?.email_addr, 'test@example.com');
  });

  it('should find entries by classUid', async () => {
    await auditLog.logAuthentication({
      activity: OCSF_AUTH_ACTIVITY.LOGOFF,
      userId: 'user-123',
      success: true,
    });

    const entries = await auditLog.find({ classUids: [OCSF_CLASS.AUTHENTICATION] });
    assert.ok(entries.length >= 1);
    assert.strictEqual(entries[0].class_uid, OCSF_CLASS.AUTHENTICATION);
  });

  it('should find entries by userId', async () => {
    await auditLog.logAccountChange({
      activity: OCSF_ACCOUNT_ACTIVITY.OTHER,
      userId: 'user-456',
      success: true,
      message: 'User Updated',
    });

    const entries = await auditLog.find({ userId: 'user-456' });
    assert.ok(entries.length >= 1);
    const event = entries[0] as OCSFAuthenticationEvent;
    assert.strictEqual(event.user?.uid, 'user-456');
  });

  it('should count entries', async () => {
    const before = await auditLog.count({});
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.READ,
      success: true,
      message: 'Data Export',
    });
    const after = await auditLog.count({});

    assert.strictEqual(after, before + 1);
  });

  it('should track failed login attempts', async () => {
    const userId = 'lockout-user';
    const ip = '10.0.0.1';

    await auditLog.logAuthentication({
      activity: OCSF_AUTH_ACTIVITY.LOGON,
      userId,
      remoteAddress: ip,
      success: false,
      message: 'Failed Login Attempt',
    });
    await auditLog.logAuthentication({
      activity: OCSF_AUTH_ACTIVITY.LOGON,
      userId,
      remoteAddress: ip,
      success: false,
      message: 'Failed Login Attempt',
    });
    await auditLog.logAuthentication({
      activity: OCSF_AUTH_ACTIVITY.LOGON,
      userId,
      remoteAddress: ip,
      success: false,
      message: 'Failed Login Attempt',
    });

    const count = await auditLog.getFailedLogins({ userId });
    assert.ok(count >= 3);
  });

  it('should maintain hash chain integrity', async () => {
    // Add several entries
    await auditLog.logAccountChange({
      activity: OCSF_ACCOUNT_ACTIVITY.CREATE,
      userId: 'new-user',
      success: true,
    });
    await auditLog.logAccountChange({
      activity: OCSF_ACCOUNT_ACTIVITY.ATTACH_POLICY,
      userId: 'new-user',
      success: true,
    });
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.UPDATE,
      userId: 'new-user',
      success: true,
      message: 'Payment Completed',
    });

    const result = await auditLog.verify();

    assert.strictEqual(result.valid, true);
    assert.ok(result.entries > 0);
    assert.strictEqual(result.entries, result.verified);
  });

  it('should have sequential sequence numbers', async () => {
    const entries = await auditLog.find({ limit: 10 });

    // Entries are returned newest first
    for (let i = 0; i < entries.length - 1; i++) {
      assert.strictEqual(entries[i].unmapped?.seq, (entries[i + 1].unmapped?.seq ?? 0) + 1);
    }
  });

  it('should filter by time range', async () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.CREATE,
      success: true,
      message: 'Order Checkout',
    });

    const entries = await auditLog.find({
      startTime: oneHourAgo,
      endTime: new Date(now.getTime() + 1000),
    });

    assert.ok(entries.length >= 1);
  });

  it('should respect limit and offset', async () => {
    const all = await auditLog.find({ limit: 100 });
    const first3 = await auditLog.find({ limit: 3 });
    const skip2 = await auditLog.find({ limit: 3, offset: 2 });

    assert.strictEqual(first3.length, Math.min(3, all.length));
    if (all.length > 2) {
      assert.strictEqual(skip2[0].metadata?.uid, first3[2].metadata?.uid);
    }
  });

  it('should set higher severity for failures', async () => {
    await auditLog.logAuthentication({
      activity: OCSF_AUTH_ACTIVITY.LOGON,
      success: false,
      message: 'Failed Login Attempt',
    });

    const entries = await auditLog.find({
      classUids: [OCSF_CLASS.AUTHENTICATION],
      success: false,
      limit: 1,
    });
    assert.ok(entries.length > 0);
    assert.strictEqual(entries[0].severity_id, OCSF_SEVERITY.HIGH);
  });

  it('should include human-readable message', async () => {
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.READ,
      success: false,
      message: 'Access Denied',
    });

    const entries = await auditLog.find({
      classUids: [OCSF_CLASS.API_ACTIVITY],
      limit: 1,
    });
    assert.ok(entries.length > 0);
    assert.strictEqual(entries[0].message, 'Access Denied');
  });

  it('should support API activity logging', async () => {
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.UPDATE,
      userId: 'payer-user',
      operation: 'processPayment',
      httpMethod: 'POST',
      path: '/api/payments',
      responseCode: 200,
      success: true,
      message: 'Payment Completed',
    });

    const entries = await auditLog.find({
      classUids: [OCSF_CLASS.API_ACTIVITY],
      userId: 'payer-user',
      limit: 1,
    });

    assert.ok(entries.length >= 1);
    assert.strictEqual(entries[0].class_uid, OCSF_CLASS.API_ACTIVITY);
  });

  it('should have default messages for e-commerce activities', async () => {
    // Test checkout activity
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.CHECKOUT,
      userId: 'checkout-user',
      success: true,
    });

    const checkoutEntries = await auditLog.find({
      classUids: [OCSF_CLASS.API_ACTIVITY],
      activityIds: [OCSF_API_ACTIVITY.CHECKOUT],
      limit: 1,
    });
    assert.ok(checkoutEntries.length >= 1);
    assert.strictEqual(checkoutEntries[0].message, 'Order Checkout');

    // Test payment activity
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.PAYMENT,
      userId: 'payment-user',
      success: true,
    });

    const paymentEntries = await auditLog.find({
      classUids: [OCSF_CLASS.API_ACTIVITY],
      activityIds: [OCSF_API_ACTIVITY.PAYMENT],
      limit: 1,
    });
    assert.ok(paymentEntries.length >= 1);
    assert.strictEqual(paymentEntries[0].message, 'Payment Processed');

    // Test access denied (should be high severity)
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.ACCESS_DENIED,
      userId: 'denied-user',
      success: false,
    });

    const deniedEntries = await auditLog.find({
      classUids: [OCSF_CLASS.API_ACTIVITY],
      activityIds: [OCSF_API_ACTIVITY.ACCESS_DENIED],
      limit: 1,
    });
    assert.ok(deniedEntries.length >= 1);
    assert.strictEqual(deniedEntries[0].message, 'Access Denied');
    assert.strictEqual(deniedEntries[0].severity_id, 4); // HIGH
  });

  it('should support account change logging with actor', async () => {
    await auditLog.logAccountChange({
      activity: OCSF_ACCOUNT_ACTIVITY.ATTACH_POLICY,
      userId: 'target-user',
      userName: 'target@example.com',
      actorUserId: 'admin-user',
      actorUserName: 'admin@example.com',
      success: true,
    });

    const entries = await auditLog.find({
      classUids: [OCSF_CLASS.ACCOUNT_CHANGE],
      userId: 'target-user',
      limit: 1,
    });

    assert.ok(entries.length >= 1);
    const event = entries[0] as any;
    assert.strictEqual(event.user?.uid, 'target-user');
    assert.strictEqual(event.actor?.user?.uid, 'admin-user');
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

  it('should have e-commerce specific API activities', () => {
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
