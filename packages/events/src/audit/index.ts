/**
 * OCSF Audit Log (Open Cybersecurity Schema Framework)
 *
 * Emits OCSF v1.4.0 compliant audit events for consumption by external
 * monitoring agents. OCSF is an industry-standard schema supported by
 * AWS Security Lake, Datadog, Splunk, Google Chronicle, and other SIEM systems.
 *
 * Sinks (fan-out per event):
 * - Structured log line via @unchainedshop/logger (default on) — with
 *   UNCHAINED_LOG_FORMAT=json any log-shipping agent can scrape stdout
 * - OTLP/HTTP push to a collector (opt-in via collectorUrl or OTEL_EXPORTER_* env)
 *
 * The engine does not persist audit events itself — retention, queries, and
 * integrity guarantees are the consuming log pipeline's or SIEM's concern.
 */

import { hostname } from 'node:os';
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
  OCSF_API_ACTIVITY_NAMES,
} from './ocsf-types.ts';
import { exportLogs, resolveCollectorUrl, resolveCollectorHeaders } from './otlp.ts';

// Re-export types
export * from './ocsf-types.ts';

const logger = createLogger('unchained:audit');

// Product metadata
const OCSF_VERSION = '1.4.0';
const PRODUCT_NAME = 'Unchained Engine';
const PRODUCT_VERSION = process.env.npm_package_version || '5.0';
const PRODUCT_VENDOR = 'Unchained';

// Fallback source endpoint for system-originated events (workers, seeding);
// OCSF requires src_endpoint on API Activity events
const ENGINE_HOSTNAME = hostname();

// ============================================================================
// Configuration
// ============================================================================

export interface AuditLogOptions {
  /** Emit every audit event as a structured log line via createLogger('unchained:audit') (default: true) */
  log?: boolean;

  /** OTLP/HTTP logs endpoint; falls back to OTEL_EXPORTER_OTLP_LOGS_ENDPOINT, else OTEL_EXPORTER_OTLP_ENDPOINT + '/v1/logs' */
  collectorUrl?: string;

  /** HTTP headers for collector requests, merged over OTEL_EXPORTER_OTLP[_LOGS]_HEADERS ("k=v,k=v" format) */
  collectorHeaders?: Record<string, string>;

  /** Number of queued events that triggers an immediate OTLP flush (default: 10) */
  batchSize?: number;

  /** Max interval between OTLP flushes in ms (default: 5000) */
  flushIntervalMs?: number;

  /** Cap on the OTLP send queue; beyond it the oldest events are dropped with a warning (default: 1000) */
  maxQueueSize?: number;
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

// ============================================================================
// Audit Log Implementation
// ============================================================================

export class AuditLog {
  private readonly logEnabled: boolean;
  private readonly auditLogger: ReturnType<typeof createLogger>;
  private readonly collectorUrl?: string;
  private readonly collectorHeaders: Record<string, string>;
  private readonly batchSize: number;
  private readonly flushIntervalMs: number;
  private readonly maxQueueSize: number;
  private readonly serviceName: string;

  private pendingEvents: OCSFEvent[] = [];
  private droppedEvents = 0;
  private flushing = false;
  private flushTimer?: ReturnType<typeof setInterval>;

  constructor(config: AuditLogOptions = {}) {
    this.logEnabled = config.log ?? true;
    this.auditLogger = createLogger('unchained:audit');
    this.collectorUrl = resolveCollectorUrl(config.collectorUrl);
    this.collectorHeaders = resolveCollectorHeaders(config.collectorHeaders);
    this.batchSize = config.batchSize || 10;
    this.flushIntervalMs = config.flushIntervalMs || 5000;
    this.maxQueueSize = config.maxQueueSize || 1000;
    this.serviceName = process.env.OTEL_SERVICE_NAME || 'unchained-engine';
  }

  // --------------------------------------------------------------------------
  // Private Helpers
  // --------------------------------------------------------------------------

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

  /** Fans the event out to all enabled sinks. */
  private async dispatch(event: OCSFEvent): Promise<string> {
    if (this.logEnabled) {
      this.auditLogger.info(event.message || 'Audit event', { ocsf: event });
    }

    if (this.collectorUrl) {
      this.enqueueForCollector(event);
    }

    return event.metadata.uid!;
  }

  private enqueueForCollector(event: OCSFEvent): void {
    this.pendingEvents.push(event);
    this.capPendingEvents();

    if (!this.flushTimer) {
      this.flushTimer = setInterval(() => {
        this.flushToCollector().catch((err) =>
          logger.error(`Failed to flush audit events to collector: ${err.message}`),
        );
      }, this.flushIntervalMs);
      this.flushTimer.unref?.();
    }

    if (this.pendingEvents.length >= this.batchSize) {
      this.flushToCollector().catch((err) =>
        logger.error(`Failed to flush audit events to collector: ${err.message}`),
      );
    }
  }

  private capPendingEvents(): void {
    while (this.pendingEvents.length > this.maxQueueSize) {
      this.pendingEvents.shift();
      this.droppedEvents += 1;
      if (this.droppedEvents === 1 || this.droppedEvents % 100 === 0) {
        logger.warn(
          `Audit collector queue exceeded ${this.maxQueueSize} events — dropped ${this.droppedEvents} events so far`,
        );
      }
    }
  }

  private async flushToCollector(): Promise<void> {
    if (!this.collectorUrl || this.flushing || this.pendingEvents.length === 0) return;

    this.flushing = true;
    const events = this.pendingEvents;
    this.pendingEvents = [];

    try {
      await exportLogs(this.collectorUrl, this.collectorHeaders, events);
      logger.debug(`Flushed ${events.length} audit events to collector`);
    } catch (err) {
      this.pendingEvents = [...events, ...this.pendingEvents];
      this.capPendingEvents();
      throw err;
    } finally {
      this.flushing = false;
    }
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
      // OCSF requires service or dst_endpoint on authentication events
      service: { name: this.serviceName },
      src_endpoint: this.createEndpoint(input.remoteAddress),
      is_mfa: input.isMfa,
      auth_protocol: input.authProtocol,
      session: input.sessionId ? { uid: input.sessionId } : undefined,
    };

    return this.dispatch(event);
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

    return this.dispatch(event);
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

    // OCSF defines activity_id 0-4 and 99 for API Activity; the internal
    // e-commerce identifiers (90-98) are emitted as Other with their label
    // in activity_name so events validate against the standard schema
    const isExtensionActivity = activityId >= 90 && activityId < 99;
    const wireActivityId = isExtensionActivity ? OCSF_API_ACTIVITY.OTHER : activityId;

    const event: OCSFApiActivityEvent = {
      category_uid: OCSF_CATEGORY.APPLICATION_ACTIVITY,
      class_uid: OCSF_CLASS.API_ACTIVITY,
      type_uid: OCSF_CLASS.API_ACTIVITY * 100 + wireActivityId,
      activity_id: wireActivityId,
      activity_name: OCSF_API_ACTIVITY_NAMES[activityId],
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
      // OCSF requires src_endpoint on API Activity; system-originated events
      // (workers, seeding) fall back to the engine host
      src_endpoint: this.createEndpoint(input.remoteAddress) || { hostname: ENGINE_HOSTNAME },
      http_request:
        input.httpMethod || input.path
          ? {
              http_method: input.httpMethod,
              url: input.path ? { path: input.path } : undefined,
            }
          : undefined,
      ...(input.data ? { unmapped: { data: input.data } } : {}),
    };

    return this.dispatch(event);
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
        logger.error(`Failed to flush pending audit events on close: ${(err as Error).message}`);
      }
    }
  }
}

export function createAuditLog(config: AuditLogOptions = {}): AuditLog {
  return new AuditLog(config);
}

let _auditLogInstance: AuditLog | null = null;

export function setAuditLogInstance(instance: AuditLog): void {
  _auditLogInstance = instance;
}

export function getAuditLogInstance(): AuditLog | null {
  return _auditLogInstance;
}
