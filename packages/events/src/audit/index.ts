/**
 * OCSF Audit Log (Open Cybersecurity Schema Framework)
 *
 * File-based, tamper-evident audit logging using OCSF format with JSON Lines storage.
 * OCSF is an industry-standard schema supported by AWS Security Lake, Datadog,
 * Splunk, Google Chronicle, and other SIEM systems.
 *
 * Features:
 * - OCSF v1.4.0 compliant event schema
 * - JSON Lines (.jsonl) file format for easy parsing
 * - SHA-256 hash chain for tamper detection
 * - Optional HTTP push to collectors (OpenTelemetry, Fluentd, Vector)
 * - Append-only (no update/delete)
 */

import { createHash } from 'node:crypto';
import { mkdir, readFile, appendFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { createLogger } from '@unchainedshop/logger';
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

// Product metadata
const OCSF_VERSION = '1.4.0';
const PRODUCT_NAME = 'Unchained Engine';
const PRODUCT_VERSION = '4.5';
const PRODUCT_VENDOR = 'Unchained';

// Genesis hash for the first entry
const GENESIS_HASH = '0'.repeat(64);

// ============================================================================
// Configuration
// ============================================================================

/**
 * Audit log configuration options
 */
export interface AuditLogConfig {
  /** Directory for file-based storage (default: ./audit-logs) */
  directory?: string;

  /** HTTP collector URL for push mode */
  collectorUrl?: string;

  /** HTTP headers for collector requests */
  collectorHeaders?: Record<string, string>;

  /** Batch size for HTTP push (default: 10) */
  batchSize?: number;

  /** Flush interval in ms for HTTP push (default: 5000) */
  flushIntervalMs?: number;
}

// ============================================================================
// Input Types
// ============================================================================

/**
 * Input for authentication events (login, logout, failed login)
 */
export interface AuthenticationInput {
  /** Activity type */
  activity: (typeof OCSF_AUTH_ACTIVITY)[keyof typeof OCSF_AUTH_ACTIVITY];
  /** User ID */
  userId?: string;
  /** Username or email */
  userName?: string;
  /** Whether the action succeeded */
  success?: boolean;
  /** Client IP address */
  remoteAddress?: string;
  /** Session ID */
  sessionId?: string;
  /** Custom message */
  message?: string;
  /** Is MFA authentication */
  isMfa?: boolean;
  /** Authentication protocol */
  authProtocol?: string;
}

/**
 * Input for account change events (user CRUD, password changes, role changes)
 */
export interface AccountChangeInput {
  /** Activity type */
  activity: (typeof OCSF_ACCOUNT_ACTIVITY)[keyof typeof OCSF_ACCOUNT_ACTIVITY];
  /** User ID */
  userId?: string;
  /** Username or email */
  userName?: string;
  /** Whether the action succeeded */
  success?: boolean;
  /** Client IP address */
  remoteAddress?: string;
  /** Session ID */
  sessionId?: string;
  /** Custom message */
  message?: string;
  /** Actor who made the change (for admin actions) */
  actorUserId?: string;
  /** Actor name */
  actorUserName?: string;
}

/**
 * Input for API activity events (API calls, access denied, payments, orders)
 */
export interface ApiActivityInput {
  /** Activity type */
  activity: (typeof OCSF_API_ACTIVITY)[keyof typeof OCSF_API_ACTIVITY];
  /** User ID */
  userId?: string;
  /** Username or email */
  userName?: string;
  /** Whether the action succeeded */
  success?: boolean;
  /** Client IP address */
  remoteAddress?: string;
  /** Session ID */
  sessionId?: string;
  /** Custom message */
  message?: string;
  /** API operation name */
  operation?: string;
  /** HTTP method */
  httpMethod?: string;
  /** Request path */
  path?: string;
  /** Response code */
  responseCode?: number;
}

/**
 * Query parameters for searching audit logs
 */
export interface AuditLogQuery {
  /** Filter by class UIDs */
  classUids?: number[];
  /** Filter by activity IDs */
  activityIds?: number[];
  /** Filter by user ID */
  userId?: string;
  /** Filter by success/failure */
  success?: boolean;
  /** Start time */
  startTime?: Date;
  /** End time */
  endTime?: Date;
  /** Maximum results */
  limit?: number;
  /** Skip entries */
  offset?: number;
}

/**
 * Verification result
 */
export interface VerifyResult {
  valid: boolean;
  entries: number;
  verified: number;
  error?: string;
}

// ============================================================================
// Audit Log Implementation
// ============================================================================

/**
 * OCSF-compliant audit log with hash chain for tamper detection.
 */
export class AuditLog {
  private readonly dir: string;
  private readonly collectorUrl?: string;
  private readonly collectorHeaders: Record<string, string>;
  private readonly batchSize: number;
  private readonly flushIntervalMs: number;

  private lastEvent: OCSFEvent | null = null;
  private writeLock: Promise<unknown> = Promise.resolve();
  private initialized = false;
  private pendingEvents: OCSFEvent[] = [];
  private flushTimer?: ReturnType<typeof setInterval>;

  constructor(config: AuditLogConfig = {}) {
    this.dir = config.directory || './audit-logs';
    this.collectorUrl = config.collectorUrl;
    this.collectorHeaders = config.collectorHeaders || {};
    this.batchSize = config.batchSize || 10;
    this.flushIntervalMs = config.flushIntervalMs || 5000;
  }

  // --------------------------------------------------------------------------
  // Private Helpers
  // --------------------------------------------------------------------------

  private getFilePath(): string {
    const date = new Date().toISOString().slice(0, 10);
    return join(this.dir, `audit-${date}.jsonl`);
  }

  private async init(): Promise<void> {
    if (this.initialized) return;

    await mkdir(this.dir, { recursive: true });

    // Find last entry across all files
    try {
      const files = (await readdir(this.dir)).filter((f) => f.endsWith('.jsonl')).sort();
      for (let i = files.length - 1; i >= 0; i--) {
        const content = await readFile(join(this.dir, files[i]), 'utf-8');
        const lines = content.trim().split('\n').filter(Boolean);
        if (lines.length > 0) {
          const parsed = JSON.parse(lines[lines.length - 1]) as OCSFEvent;
          if (parsed.unmapped?.hash) {
            this.lastEvent = parsed;
            break;
          }
        }
      }
    } catch {
      // No existing files
    }

    // Start flush timer if using HTTP push
    if (this.collectorUrl && !this.flushTimer) {
      this.flushTimer = setInterval(() => this.flushToCollector(), this.flushIntervalMs);
    }

    this.initialized = true;
  }

  private computeHash(
    event: Omit<OCSFEvent, 'unmapped'> & { unmapped?: Partial<OCSFEvent['unmapped']> },
  ): string {
    // Canonicalize the event for hashing (exclude hash field)
    const { unmapped, ...rest } = event;
    const toHash = {
      ...rest,
      unmapped: unmapped ? { seq: unmapped.seq, prev_hash: unmapped.prev_hash } : undefined,
    };
    const data = JSON.stringify(toHash, Object.keys(toHash).sort());
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

      // Build hash chain
      const prevHash = this.lastEvent?.unmapped?.hash || GENESIS_HASH;
      const seq = (this.lastEvent?.unmapped?.seq || 0) + 1;

      // Create event with hash chain
      const eventWithChain: OCSFEvent = {
        ...event,
        unmapped: {
          seq,
          prev_hash: prevHash,
          hash: '', // Will be computed
        },
      };

      // Compute hash
      const hash = this.computeHash(eventWithChain);
      eventWithChain.unmapped!.hash = hash;

      // Write to file
      const line = JSON.stringify(eventWithChain);
      await appendFile(this.getFilePath(), line + '\n', 'utf-8');

      // Update state
      this.lastEvent = eventWithChain;

      // Queue for HTTP push if configured
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

    this.writeLock = result;
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
      // Re-queue events on failure
      this.pendingEvents = [...events, ...this.pendingEvents];
      throw err;
    }
  }

  private matches(event: OCSFEvent, query: AuditLogQuery): boolean {
    if (query.classUids?.length && !query.classUids.includes(event.class_uid)) return false;
    if (query.activityIds?.length && !query.activityIds.includes(event.activity_id)) return false;

    // Check user ID in different event types
    const userId = 'user' in event ? (event as OCSFAuthenticationEvent).user?.uid : undefined;
    const actorId = 'actor' in event ? (event as OCSFApiActivityEvent).actor?.user?.uid : undefined;
    if (query.userId && userId !== query.userId && actorId !== query.userId) return false;

    if (query.success !== undefined) {
      const isSuccess = event.status_id === OCSF_STATUS.SUCCESS;
      if (query.success !== isSuccess) return false;
    }

    if (query.startTime || query.endTime) {
      const ts = new Date(event.time);
      if (query.startTime && ts < query.startTime) return false;
      if (query.endTime && ts > query.endTime) return false;
    }

    return true;
  }

  // --------------------------------------------------------------------------
  // Public API - Typed Event Methods
  // --------------------------------------------------------------------------

  /**
   * Log an authentication event (login, logout, failed login)
   */
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

  /**
   * Log an account change event (user CRUD, password changes, role changes)
   */
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

  /**
   * Log an API activity event (API calls, access denied, payments, orders)
   */
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

    // Access denied events are always high severity
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
    };

    return this.writeEvent(event);
  }

  // --------------------------------------------------------------------------
  // Public API - Query & Verify
  // --------------------------------------------------------------------------

  /**
   * Find audit logs matching query
   */
  async find(query: AuditLogQuery = {}): Promise<OCSFEvent[]> {
    await this.init();

    const results: OCSFEvent[] = [];
    const limit = query.limit || 100;
    const offset = query.offset || 0;
    let skipped = 0;

    try {
      const files = (await readdir(this.dir)).filter((f) => f.endsWith('.jsonl')).sort();

      // Search newest first
      for (let i = files.length - 1; i >= 0 && results.length < limit; i--) {
        const content = await readFile(join(this.dir, files[i]), 'utf-8');
        const lines = content.trim().split('\n').filter(Boolean);

        for (let j = lines.length - 1; j >= 0 && results.length < limit; j--) {
          try {
            const event = JSON.parse(lines[j]) as OCSFEvent;

            if (!this.matches(event, query)) continue;

            if (skipped < offset) {
              skipped++;
              continue;
            }

            results.push(event);
          } catch {
            // Skip malformed lines
          }
        }
      }
    } catch {
      // Directory doesn't exist
    }

    return results;
  }

  /**
   * Count entries matching query
   */
  async count(query: AuditLogQuery = {}): Promise<number> {
    await this.init();

    let count = 0;

    try {
      const files = (await readdir(this.dir)).filter((f) => f.endsWith('.jsonl')).sort();

      for (const file of files) {
        const content = await readFile(join(this.dir, file), 'utf-8');
        const lines = content.trim().split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const event = JSON.parse(line) as OCSFEvent;
            if (this.matches(event, query)) count++;
          } catch {
            // Skip malformed lines
          }
        }
      }
    } catch {
      // Directory doesn't exist
    }

    return count;
  }

  /**
   * Get failed login attempts for rate limiting / lockout
   */
  async getFailedLogins(params: {
    userId?: string;
    remoteAddress?: string;
    since?: Date;
  }): Promise<number> {
    const events = await this.find({
      classUids: [OCSF_CLASS.AUTHENTICATION],
      activityIds: [OCSF_AUTH_ACTIVITY.LOGON],
      userId: params.userId,
      success: false,
      startTime: params.since,
    });

    // Filter by IP if specified
    if (params.remoteAddress) {
      return events.filter((e) => {
        const authEvent = e as OCSFAuthenticationEvent;
        return authEvent.src_endpoint?.ip === params.remoteAddress;
      }).length;
    }

    return events.length;
  }

  /**
   * Verify the integrity of the hash chain
   */
  async verify(): Promise<VerifyResult> {
    await this.init();

    let entries = 0;
    let verified = 0;
    let prevHash = GENESIS_HASH;
    let prevSeq = 0;

    try {
      const files = (await readdir(this.dir)).filter((f) => f.endsWith('.jsonl')).sort();

      for (const file of files) {
        const content = await readFile(join(this.dir, file), 'utf-8');
        const lines = content.trim().split('\n').filter(Boolean);

        for (const line of lines) {
          entries++;

          let event: OCSFEvent;
          try {
            event = JSON.parse(line) as OCSFEvent;
          } catch {
            return { valid: false, entries, verified, error: `Parse error at entry ${entries}` };
          }

          if (!event.unmapped) {
            return { valid: false, entries, verified, error: `Missing hash chain at entry ${entries}` };
          }

          // Verify sequence
          if (event.unmapped.seq !== prevSeq + 1) {
            return { valid: false, entries, verified, error: `Sequence gap at ${event.unmapped.seq}` };
          }

          // Verify previous hash link
          if (event.unmapped.prev_hash !== prevHash) {
            return {
              valid: false,
              entries,
              verified,
              error: `Chain broken at seq ${event.unmapped.seq}`,
            };
          }

          // Verify entry hash
          const computedHash = this.computeHash(event);
          if (computedHash !== event.unmapped.hash) {
            return {
              valid: false,
              entries,
              verified,
              error: `Hash mismatch at seq ${event.unmapped.seq}`,
            };
          }

          verified++;
          prevHash = event.unmapped.hash;
          prevSeq = event.unmapped.seq;
        }
      }
    } catch (e) {
      return { valid: false, entries, verified, error: `Read error: ${e}` };
    }

    return { valid: true, entries, verified };
  }

  /**
   * Close the audit log (flush pending events, stop timers)
   */
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

/**
 * Create an audit log instance
 */
export function createAuditLog(config?: AuditLogConfig | string): AuditLog {
  if (typeof config === 'string') {
    return new AuditLog({ directory: config });
  }
  return new AuditLog(config);
}
