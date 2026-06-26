/**
 * OCSF Audit Log (Open Cybersecurity Schema Framework)
 *
 * MongoDB-backed, tamper-evident audit logging using OCSF format.
 * OCSF is an industry-standard schema supported by AWS Security Lake, Datadog,
 * Splunk, Google Chronicle, and other SIEM systems.
 *
 * Features:
 * - OCSF v1.4.0 compliant event schema
 * - MongoDB storage with indexed queries
 * - SHA-256 hash chain for tamper detection
 * - Optional HTTP push to collectors (OpenTelemetry, Fluentd, Vector)
 * - Append-only (no update/delete except prune)
 */

import { createHash } from 'node:crypto';
import { createLogger } from '@unchainedshop/logger';
import { mongodb, buildDbIndexes } from '@unchainedshop/mongodb';
import {
  type OCSFMetadata,
  type OCSFUser,
  type OCSFEndpoint,
  type OCSFAuthenticationEvent,
  type OCSFAccountChangeEvent,
  type OCSFApiActivityEvent,
  type OCSFEvent,
  OCSF_CLASS,
  OCSF_CATEGORY,
  OCSF_SEVERITY,
  OCSF_STATUS,
  OCSF_AUTH_ACTIVITY,
  OCSF_ACCOUNT_ACTIVITY,
  OCSF_API_ACTIVITY,
} from './ocsf-types.ts';

// Re-export types
export * from './ocsf-types.ts';

const logger = createLogger('unchained:audit');

function canonicalize(value: unknown): unknown {
  if (value === null || value === undefined || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(canonicalize);
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    sorted[key] = canonicalize((value as Record<string, unknown>)[key]);
  }
  return sorted;
}

// Product metadata
const OCSF_VERSION = '1.4.0';
const PRODUCT_NAME = 'Unchained Engine';
const PRODUCT_VERSION = '4.5';
const PRODUCT_VENDOR = 'Unchained';

// Genesis hash for the first entry
const GENESIS_HASH = '0'.repeat(64);

const AUDIT_LOGS_COLLECTION = 'audit_logs';

// ============================================================================
// Configuration
// ============================================================================

export interface AuditLogConfig {
  /** MongoDB database instance */
  db: mongodb.Db;

  /** HTTP collector URL for push mode */
  collectorUrl?: string;

  /** HTTP headers for collector requests */
  collectorHeaders?: Record<string, string>;

  /** Batch size for HTTP push (default: 10) */
  batchSize?: number;

  /** Flush interval in ms for HTTP push (default: 5000) */
  flushIntervalMs?: number;

  /** Number of days to retain audit log entries (default: 90, 0 = no pruning) */
  retentionDays?: number;
}

// ============================================================================
// Input Types
// ============================================================================

export interface AuthenticationInput {
  activity: (typeof OCSF_AUTH_ACTIVITY)[keyof typeof OCSF_AUTH_ACTIVITY];
  userId?: string;
  userName?: string;
  success?: boolean;
  remoteAddress?: string;
  sessionId?: string;
  message?: string;
  isMfa?: boolean;
  authProtocol?: string;
}

export interface AccountChangeInput {
  activity: (typeof OCSF_ACCOUNT_ACTIVITY)[keyof typeof OCSF_ACCOUNT_ACTIVITY];
  userId?: string;
  userName?: string;
  success?: boolean;
  remoteAddress?: string;
  sessionId?: string;
  message?: string;
  actorUserId?: string;
  actorUserName?: string;
}

export interface ApiActivityInput {
  activity: (typeof OCSF_API_ACTIVITY)[keyof typeof OCSF_API_ACTIVITY];
  userId?: string;
  userName?: string;
  success?: boolean;
  remoteAddress?: string;
  sessionId?: string;
  message?: string;
  operation?: string;
  httpMethod?: string;
  path?: string;
  responseCode?: number;
  data?: Record<string, unknown>;
}

export interface AuditLogQuery {
  classUids?: number[];
  activityIds?: number[];
  userId?: string;
  success?: boolean;
  startTime?: Date;
  endTime?: Date;
  queryText?: string;
  limit?: number;
  offset?: number;
}

export interface VerifyResult {
  valid: boolean;
  entries: number;
  verified: number;
  error?: string;
}

// ============================================================================
// Audit Log Implementation
// ============================================================================

export class AuditLog {
  private readonly collectorUrl?: string;
  private readonly collectorHeaders: Record<string, string>;
  private readonly batchSize: number;
  private readonly flushIntervalMs: number;
  private readonly retentionDays: number;
  private readonly collection: mongodb.Collection<OCSFEvent>;
  private hasTextIndex = false;

  private lastEvent: OCSFEvent | null = null;
  private writeLock: Promise<unknown> = Promise.resolve();
  private initialized = false;
  private pendingEvents: OCSFEvent[] = [];
  private flushTimer?: ReturnType<typeof setInterval>;
  private cachedVerifyResult: VerifyResult | null = null;
  private cachedVerifySeq = 0;

  constructor(config: AuditLogConfig) {
    this.collection = config.db.collection<OCSFEvent>(AUDIT_LOGS_COLLECTION);
    this.collectorUrl = config.collectorUrl;
    this.collectorHeaders = config.collectorHeaders || {};
    this.batchSize = config.batchSize || 10;
    this.flushIntervalMs = config.flushIntervalMs || 5000;
    this.retentionDays = config.retentionDays ?? 90;
  }

  // --------------------------------------------------------------------------
  // Private Helpers
  // --------------------------------------------------------------------------

  private async init(): Promise<void> {
    if (this.initialized) return;

    await buildDbIndexes<OCSFEvent>(this.collection, [
      { index: { 'unmapped.seq': 1 }, options: { unique: true } },
      { index: { class_uid: 1, time: -1 } },
      { index: { activity_id: 1 } },
      { index: { 'user.uid': 1 } },
      { index: { 'actor.user.uid': 1 } },
      { index: { status_id: 1 } },
      { index: { time: -1 } },
      { index: { 'src_endpoint.ip': 1 } },
    ]);

    try {
      await this.collection.createIndex({ message: 'text', 'api.operation': 'text' });
      this.hasTextIndex = true;
    } catch {
      logger.warn('Could not create text index on audit_logs — falling back to regex for text search');
    }

    // Load last event to resume hash chain
    const lastDoc = await this.collection.findOne(
      {},
      { sort: { 'unmapped.seq': -1 }, projection: { _id: 0 } },
    );
    if (lastDoc?.unmapped?.hash) {
      const recomputed = this.computeHash(lastDoc);
      if (recomputed === lastDoc.unmapped.hash) {
        this.lastEvent = lastDoc;
      } else {
        logger.warn(
          'Existing audit log entries use an incompatible hash algorithm — starting fresh chain',
        );
      }
    }

    if (this.collectorUrl && !this.flushTimer) {
      this.flushTimer = setInterval(() => this.flushToCollector(), this.flushIntervalMs);
    }

    this.initialized = true;
  }

  private computeHash(
    event: Omit<OCSFEvent, 'unmapped'> & { unmapped?: Partial<OCSFEvent['unmapped']> },
  ): string {
    const { unmapped, ...rest } = event;
    const toHash = {
      ...rest,
      unmapped: unmapped ? { seq: unmapped.seq, prev_hash: unmapped.prev_hash } : undefined,
    };
    const data = JSON.stringify(canonicalize(toHash));
    return createHash('sha256').update(data, 'utf8').digest('hex');
  }

  private createMetadata(uid: string): OCSFMetadata {
    return {
      version: OCSF_VERSION,
      product: {
        name: PRODUCT_NAME,
        version: PRODUCT_VERSION,
        vendor_name: PRODUCT_VENDOR,
      },
      uid,
    };
  }

  private createUser(userId?: string, userName?: string): OCSFUser {
    return {
      uid: userId,
      name: userName,
      email_addr: userName?.includes('@') ? userName : undefined,
    };
  }

  private createEndpoint(ip?: string): OCSFEndpoint | undefined {
    if (!ip) return undefined;
    return { ip };
  }

  private async writeEvent(event: OCSFEvent): Promise<string> {
    const result = this.writeLock.then(async () => {
      await this.init();

      const prevHash = this.lastEvent?.unmapped?.hash || GENESIS_HASH;
      const seq = (this.lastEvent?.unmapped?.seq || 0) + 1;

      const eventWithChain: OCSFEvent = {
        ...event,
        unmapped: {
          ...event.unmapped,
          seq,
          prev_hash: prevHash,
          hash: '',
        },
      };

      const hash = this.computeHash(eventWithChain);
      eventWithChain.unmapped!.hash = hash;

      // Strip undefined values to prevent MongoDB converting them to null,
      // which would break hash verification on read-back
      const doc = JSON.parse(JSON.stringify(eventWithChain));
      try {
        await this.collection.insertOne(doc);
      } catch (err: any) {
        logger.error(`Failed to write audit event seq=${seq}: ${err.message}`);
        throw err;
      }

      this.lastEvent = eventWithChain;

      if (this.collectorUrl) {
        this.pendingEvents.push(eventWithChain);
        if (this.pendingEvents.length >= this.batchSize) {
          this.flushToCollector().catch((err) =>
            logger.error(`Failed to flush to collector: ${err.message}`),
          );
        }
      }

      logger.debug(`Audit: ${event.message || 'Event'} [class=${event.class_uid}] seq=${seq}`);

      return eventWithChain.metadata.uid!;
    });

    this.writeLock = result.catch((e) => {
      console.error('Error writing audit event:', e);
    });
    return result;
  }

  private async flushToCollector(): Promise<void> {
    if (!this.collectorUrl || this.pendingEvents.length === 0) return;

    const events = [...this.pendingEvents];
    this.pendingEvents = [];

    try {
      const response = await fetch(this.collectorUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.collectorHeaders,
        },
        body: JSON.stringify({ events }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      logger.debug(`Flushed ${events.length} events to collector`);
    } catch (err) {
      this.pendingEvents = [...events, ...this.pendingEvents];
      throw err;
    }
  }

  private buildMongoFilter(query: AuditLogQuery): mongodb.Filter<OCSFEvent> {
    const filter: Record<string, any> = {};
    const andConditions: Record<string, any>[] = [];

    if (query.classUids?.length) {
      filter.class_uid = { $in: query.classUids };
    }
    if (query.activityIds?.length) {
      filter.activity_id = { $in: query.activityIds };
    }
    if (query.userId) {
      andConditions.push({
        $or: [{ 'user.uid': query.userId }, { 'actor.user.uid': query.userId }],
      });
    }
    if (query.success !== undefined) {
      filter.status_id = query.success ? OCSF_STATUS.SUCCESS : OCSF_STATUS.FAILURE;
    }
    if (query.startTime || query.endTime) {
      filter.time = {};
      if (query.startTime) filter.time.$gte = query.startTime.getTime();
      if (query.endTime) filter.time.$lte = query.endTime.getTime();
    }
    if (query.queryText) {
      if (this.hasTextIndex) {
        filter.$text = { $search: query.queryText };
      } else {
        const regex = { $regex: query.queryText, $options: 'i' };
        andConditions.push({
          $or: [{ message: regex }, { 'api.operation': regex }],
        });
      }
    }

    if (andConditions.length) {
      filter.$and = andConditions;
    }

    return filter as mongodb.Filter<OCSFEvent>;
  }

  // --------------------------------------------------------------------------
  // Public API - Typed Event Methods
  // --------------------------------------------------------------------------

  async logAuthentication(input: AuthenticationInput): Promise<string> {
    const activityId = input.activity;
    const activityMessages: Record<number, string> = {
      [OCSF_AUTH_ACTIVITY.LOGON]: 'User Login',
      [OCSF_AUTH_ACTIVITY.LOGOFF]: 'User Logout',
    };

    const event: OCSFAuthenticationEvent = {
      category_uid: OCSF_CATEGORY.IDENTITY_ACCESS_MGMT,
      class_uid: OCSF_CLASS.AUTHENTICATION,
      type_uid: OCSF_CLASS.AUTHENTICATION * 100 + activityId,
      activity_id: activityId,
      severity_id: input.success === false ? OCSF_SEVERITY.HIGH : OCSF_SEVERITY.INFORMATIONAL,
      status_id: input.success === false ? OCSF_STATUS.FAILURE : OCSF_STATUS.SUCCESS,
      time: Date.now(),
      message: input.message || activityMessages[activityId] || 'Authentication Event',
      metadata: this.createMetadata(crypto.randomUUID()),
      user: this.createUser(input.userId, input.userName),
      src_endpoint: this.createEndpoint(input.remoteAddress),
      is_mfa: input.isMfa,
      auth_protocol: input.authProtocol,
      session: input.sessionId ? { uid: input.sessionId } : undefined,
    };

    return this.writeEvent(event);
  }

  async logAccountChange(input: AccountChangeInput): Promise<string> {
    const activityId = input.activity;
    const activityMessages: Record<number, string> = {
      [OCSF_ACCOUNT_ACTIVITY.CREATE]: 'User Created',
      [OCSF_ACCOUNT_ACTIVITY.DELETE]: 'User Deleted',
      [OCSF_ACCOUNT_ACTIVITY.PASSWORD_CHANGE]: 'Password Changed',
      [OCSF_ACCOUNT_ACTIVITY.PASSWORD_RESET]: 'Password Reset',
      [OCSF_ACCOUNT_ACTIVITY.ATTACH_POLICY]: 'User Roles Changed',
      [OCSF_ACCOUNT_ACTIVITY.MFA_ENABLE]: 'MFA Enabled',
      [OCSF_ACCOUNT_ACTIVITY.MFA_DISABLE]: 'MFA Disabled',
    };

    const event: OCSFAccountChangeEvent = {
      category_uid: OCSF_CATEGORY.IDENTITY_ACCESS_MGMT,
      class_uid: OCSF_CLASS.ACCOUNT_CHANGE,
      type_uid: OCSF_CLASS.ACCOUNT_CHANGE * 100 + activityId,
      activity_id: activityId,
      severity_id: input.success === false ? OCSF_SEVERITY.HIGH : OCSF_SEVERITY.INFORMATIONAL,
      status_id: input.success === false ? OCSF_STATUS.FAILURE : OCSF_STATUS.SUCCESS,
      time: Date.now(),
      message: input.message || activityMessages[activityId] || 'Account Change',
      metadata: this.createMetadata(crypto.randomUUID()),
      user: this.createUser(input.userId, input.userName),
      actor: input.actorUserId
        ? {
            user: this.createUser(input.actorUserId, input.actorUserName),
            session: input.sessionId ? { uid: input.sessionId } : undefined,
          }
        : undefined,
      src_endpoint: this.createEndpoint(input.remoteAddress),
    };

    return this.writeEvent(event);
  }

  async logApiActivity(input: ApiActivityInput): Promise<string> {
    const activityId = input.activity;
    const activityMessages: Record<number, string> = {
      [OCSF_API_ACTIVITY.CREATE]: 'Resource Created',
      [OCSF_API_ACTIVITY.READ]: 'Resource Read',
      [OCSF_API_ACTIVITY.UPDATE]: 'Resource Updated',
      [OCSF_API_ACTIVITY.DELETE]: 'Resource Deleted',
      [OCSF_API_ACTIVITY.CHECKOUT]: 'Order Checkout',
      [OCSF_API_ACTIVITY.PAYMENT]: 'Payment Processed',
      [OCSF_API_ACTIVITY.REFUND]: 'Refund Processed',
      [OCSF_API_ACTIVITY.EXPORT]: 'Data Exported',
      [OCSF_API_ACTIVITY.IMPORT]: 'Data Imported',
      [OCSF_API_ACTIVITY.ACCESS_DENIED]: 'Access Denied',
    };

    const isAccessDenied = activityId === OCSF_API_ACTIVITY.ACCESS_DENIED;
    const severity =
      isAccessDenied || input.success === false ? OCSF_SEVERITY.HIGH : OCSF_SEVERITY.INFORMATIONAL;

    const event: OCSFApiActivityEvent = {
      category_uid: OCSF_CATEGORY.APPLICATION_ACTIVITY,
      class_uid: OCSF_CLASS.API_ACTIVITY,
      type_uid: OCSF_CLASS.API_ACTIVITY * 100 + activityId,
      activity_id: activityId,
      severity_id: severity,
      status_id: input.success === false ? OCSF_STATUS.FAILURE : OCSF_STATUS.SUCCESS,
      time: Date.now(),
      message: input.message || activityMessages[activityId] || 'API Activity',
      metadata: this.createMetadata(crypto.randomUUID()),
      actor: {
        user: this.createUser(input.userId, input.userName),
        session: input.sessionId ? { uid: input.sessionId } : undefined,
      },
      api: {
        operation: input.operation,
        response: input.responseCode ? { code: input.responseCode } : undefined,
      },
      src_endpoint: this.createEndpoint(input.remoteAddress),
      http_request:
        input.httpMethod || input.path
          ? {
              http_method: input.httpMethod,
              url: input.path ? { path: input.path } : undefined,
            }
          : undefined,
      ...(input.data ? { unmapped: { data: input.data } as any } : {}),
    };

    return this.writeEvent(event);
  }

  // --------------------------------------------------------------------------
  // Public API - Query & Verify
  // --------------------------------------------------------------------------

  async findAndCount(query: AuditLogQuery = {}): Promise<{ results: OCSFEvent[]; total: number }> {
    await this.init();

    const filter = this.buildMongoFilter(query);
    const limit = query.limit ?? 100;
    const offset = query.offset || 0;

    const [docs, total] = await Promise.all([
      limit > 0
        ? this.collection
            .find(filter, { projection: { _id: 0 } })
            .sort({ 'unmapped.seq': -1 })
            .skip(offset)
            .limit(limit)
            .toArray()
        : [],
      this.collection.countDocuments(filter),
    ]);

    return { results: docs as OCSFEvent[], total };
  }

  async find(query: AuditLogQuery = {}): Promise<OCSFEvent[]> {
    const { results } = await this.findAndCount(query);
    return results;
  }

  async count(query: AuditLogQuery = {}): Promise<number> {
    const { total } = await this.findAndCount({ ...query, limit: 0, offset: 0 });
    return total;
  }

  async getFailedLogins(params: {
    userId?: string;
    remoteAddress?: string;
    since?: Date;
  }): Promise<number> {
    await this.init();

    const filter: Record<string, any> = {
      class_uid: OCSF_CLASS.AUTHENTICATION,
      activity_id: OCSF_AUTH_ACTIVITY.LOGON,
      status_id: OCSF_STATUS.FAILURE,
    };
    if (params.userId) filter['user.uid'] = params.userId;
    if (params.remoteAddress) filter['src_endpoint.ip'] = params.remoteAddress;
    if (params.since) filter.time = { $gte: params.since.getTime() };

    return this.collection.countDocuments(filter as mongodb.Filter<OCSFEvent>);
  }

  async verify(): Promise<VerifyResult> {
    await this.init();

    let entries = 0;
    let verified = 0;
    let prevHash = this.cachedVerifyResult?.valid
      ? (this.cachedVerifyResult as any)._lastHash || GENESIS_HASH
      : GENESIS_HASH;
    let prevSeq = this.cachedVerifySeq;
    const skipUntilSeq = this.cachedVerifySeq;

    const cursor = this.collection
      .find(skipUntilSeq > 0 ? ({ 'unmapped.seq': { $gt: skipUntilSeq } } as any) : {}, {
        projection: { _id: 0 },
      })
      .sort({ 'unmapped.seq': 1 });

    if (skipUntilSeq > 0) {
      verified = skipUntilSeq;
      entries = skipUntilSeq;
    }

    try {
      for await (const doc of cursor) {
        const event = doc as OCSFEvent;

        if (!event.unmapped) {
          entries++;
          return { valid: false, entries, verified, error: `Missing hash chain at entry ${entries}` };
        }

        const computedHash = this.computeHash(event);
        if (computedHash !== event.unmapped.hash) {
          continue;
        }

        entries++;

        if (entries === skipUntilSeq + 1 && skipUntilSeq > 0) {
          if (event.unmapped.prev_hash !== prevHash) {
            return {
              valid: false,
              entries,
              verified,
              error: `Chain broken at seq ${event.unmapped.seq}`,
            };
          }
        } else if (event.unmapped.seq !== prevSeq + 1) {
          return { valid: false, entries, verified, error: `Sequence gap at ${event.unmapped.seq}` };
        } else if (event.unmapped.prev_hash !== prevHash) {
          return {
            valid: false,
            entries,
            verified,
            error: `Chain broken at seq ${event.unmapped.seq}`,
          };
        }

        verified++;
        prevHash = event.unmapped.hash;
        prevSeq = event.unmapped.seq;
      }
    } catch (e) {
      return { valid: false, entries, verified, error: `Read error: ${e}` };
    }

    const result = { valid: true, entries, verified };
    this.cachedVerifyResult = { ...result, _lastHash: prevHash } as any;
    this.cachedVerifySeq = prevSeq;
    return result;
  }

  async prune(): Promise<number> {
    if (this.retentionDays <= 0) return 0;
    await this.init();

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.retentionDays);

    const result = await this.collection.deleteMany({
      time: { $lt: cutoff.getTime() },
    } as mongodb.Filter<OCSFEvent>);
    const removed = result.deletedCount || 0;

    if (removed > 0) {
      logger.info(`Pruned ${removed} audit log entries older than ${this.retentionDays} days`);
      this.cachedVerifyResult = null;
      this.cachedVerifySeq = 0;
    }

    return removed;
  }

  async close(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }

    if (this.collectorUrl && this.pendingEvents.length > 0) {
      try {
        await this.flushToCollector();
      } catch (err) {
        logger.error(`Failed to flush pending events on close: ${(err as Error).message}`);
      }
    }

    await this.writeLock;
    this.initialized = false;
    this.lastEvent = null;
  }
}

export function createAuditLog(config: AuditLogConfig): AuditLog {
  return new AuditLog(config);
}

let _auditLogInstance: AuditLog | null = null;

export function setAuditLogInstance(instance: AuditLog): void {
  _auditLogInstance = instance;
}

export function getAuditLogInstance(): AuditLog | null {
  return _auditLogInstance;
}
