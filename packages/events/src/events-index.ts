import { EventDirector, type EmitAdapter, type RawPayloadType } from './EventDirector.ts';

const {
  emit,
  getEmitAdapter,
  getEmitHistoryAdapter,
  getRegisteredEvents,
  registerEvents,
  setEmitAdapter,
  setEmitHistoryAdapter,
  subscribe,
} = EventDirector;

const GLOBAL_EVENTS = ['PAGE_VIEW'];
registerEvents(GLOBAL_EVENTS);

export {
  emit,
  getEmitAdapter,
  getEmitHistoryAdapter,
  getRegisteredEvents,
  registerEvents,
  setEmitAdapter,
  setEmitHistoryAdapter,
  subscribe,
};

export type { EmitAdapter, RawPayloadType };

// Append-only audit logging for compliance (OCSF format)
export {
  // Main class and factory
  AuditLog,
  createAuditLog,
  // OCSF constants
  OCSF_CLASS,
  OCSF_CATEGORY,
  OCSF_SEVERITY,
  OCSF_STATUS,
  OCSF_AUTH_ACTIVITY,
  OCSF_ACCOUNT_ACTIVITY,
  OCSF_API_ACTIVITY,
  // Types
  type AuditLogConfig,
  type AuthenticationInput,
  type AccountChangeInput,
  type ApiActivityInput,
  type AuditLogQuery,
  type VerifyResult,
  // OCSF types
  type OCSFBaseEvent,
  type OCSFAuthenticationEvent,
  type OCSFAccountChangeEvent,
  type OCSFApiActivityEvent,
  type OCSFEvent,
  type OCSFMetadata,
  type OCSFUser,
  type OCSFActor,
  type OCSFEndpoint,
  type OCSFApi,
  type OCSFSession,
} from './audit/index.ts';

// Audit log integration with event system
export { configureAuditIntegration, AUDITED_EVENTS } from './audit/audit-integration.ts';
