/**
 * OCSF (Open Cybersecurity Schema Framework) Type Definitions
 *
 * Based on OCSF Schema v1.4.0
 * https://schema.ocsf.io/
 *
 * This module defines TypeScript interfaces for OCSF event classes used in
 * Unchained's compliance-focused audit logging.
 */

// ============================================================================
// OCSF Constants
// ============================================================================

/**
 * OCSF Category UIDs
 */
export const OCSF_CATEGORY = {
  IDENTITY_ACCESS_MGMT: 3, // Identity & Access Management
  APPLICATION_ACTIVITY: 6, // Application Activity
} as const;

/**
 * OCSF Class UIDs
 */
export const OCSF_CLASS = {
  ACCOUNT_CHANGE: 3001,
  AUTHENTICATION: 3002,
  AUTHORIZE_SESSION: 3003,
  API_ACTIVITY: 6003,
} as const;

/**
 * OCSF Severity IDs (0-6 scale, maps to 0-10 severity)
 */
export const OCSF_SEVERITY = {
  UNKNOWN: 0,
  INFORMATIONAL: 1, // Severity 1-3
  LOW: 2, // Severity 4
  MEDIUM: 3, // Severity 5
  HIGH: 4, // Severity 6-7
  CRITICAL: 5, // Severity 8-9
  FATAL: 6, // Severity 10
} as const;

/**
 * OCSF Status IDs for authentication/API results
 */
export const OCSF_STATUS = {
  UNKNOWN: 0,
  SUCCESS: 1,
  FAILURE: 2,
  OTHER: 99,
} as const;

/**
 * OCSF Authentication Activity IDs
 */
export const OCSF_AUTH_ACTIVITY = {
  UNKNOWN: 0,
  LOGON: 1,
  LOGOFF: 2,
  AUTHENTICATION_TICKET: 3,
  SERVICE_TICKET_REQUEST: 4,
  SERVICE_TICKET_RENEW: 5,
  PREAUTH: 6,
  OTHER: 99,
} as const;

/**
 * OCSF Account Change Activity IDs
 */
export const OCSF_ACCOUNT_ACTIVITY = {
  UNKNOWN: 0,
  CREATE: 1,
  ENABLE: 2,
  PASSWORD_CHANGE: 3,
  PASSWORD_RESET: 4,
  DISABLE: 5,
  DELETE: 6,
  ATTACH_POLICY: 7,
  DETACH_POLICY: 8,
  LOCK: 9,
  MFA_ENABLE: 10,
  MFA_DISABLE: 11,
  OTHER: 99,
} as const;

/**
 * OCSF API Activity IDs
 * Standard OCSF IDs (1-4) plus e-commerce extensions (90-99)
 */
export const OCSF_API_ACTIVITY = {
  // Standard OCSF activities
  UNKNOWN: 0,
  CREATE: 1,
  READ: 2,
  UPDATE: 3,
  DELETE: 4,

  // E-commerce specific activities (extension range)
  CHECKOUT: 90, // Order checkout
  PAYMENT: 91, // Payment processing
  REFUND: 92, // Refund processing
  EXPORT: 93, // Data export (GDPR)
  IMPORT: 94, // Data import
  ACCESS_DENIED: 95, // Authorization failure

  OTHER: 99,
} as const;

// ============================================================================
// OCSF Object Types
// ============================================================================

/**
 * OCSF Metadata object - required on all events
 */
export interface OCSFMetadata {
  /** OCSF schema version */
  version: string;
  /** Product info */
  product: {
    name: string;
    version: string;
    vendor_name?: string;
  };
  /** Unique event ID */
  uid?: string;
  /** Original event time if different from time */
  original_time?: number;
  /** Sequence number for ordering */
  sequence?: number;
}

/**
 * OCSF User object
 */
export interface OCSFUser {
  /** Unique user identifier */
  uid?: string;
  /** Username or email */
  name?: string;
  /** User's email address */
  email_addr?: string;
  /** User type (e.g., "User", "Admin", "System") */
  type?: string;
  /** User type ID */
  type_id?: number;
}

/**
 * OCSF Actor object - who performed the action
 */
export interface OCSFActor {
  /** User who performed the action */
  user?: OCSFUser;
  /** Session info */
  session?: OCSFSession;
  /** Invoked by (for impersonation) */
  invoked_by?: string;
}

/**
 * OCSF Session object
 */
export interface OCSFSession {
  /** Session unique identifier */
  uid?: string;
  /** Session creation time */
  created_time?: number;
  /** Is MFA session */
  is_mfa?: boolean;
}

/**
 * OCSF Endpoint object - source or destination
 */
export interface OCSFEndpoint {
  /** IP address */
  ip?: string;
  /** Port number */
  port?: number;
  /** Hostname */
  hostname?: string;
  /** User agent string */
  agent_list?: { name?: string; version?: string }[];
}

/**
 * OCSF API object - describes the API call
 */
export interface OCSFApi {
  /** API operation name */
  operation?: string;
  /** API service name */
  service?: {
    name?: string;
  };
  /** API request details */
  request?: {
    uid?: string;
  };
  /** API response details */
  response?: {
    code?: number;
    message?: string;
  };
}

// ============================================================================
// OCSF Base Event
// ============================================================================

/**
 * Base OCSF event structure - all events extend this
 */
export interface OCSFBaseEvent {
  /** Event category (e.g., 3 for IAM, 6 for Application) */
  category_uid: number;
  /** Event class (e.g., 3002 for Authentication) */
  class_uid: number;
  /** Event type = class_uid * 100 + activity_id */
  type_uid: number;
  /** Activity type within the class */
  activity_id: number;
  /** Severity level (0-6) */
  severity_id: number;
  /** Event timestamp (Unix ms) */
  time: number;
  /** Human-readable message */
  message?: string;
  /** Event metadata */
  metadata: OCSFMetadata;
  /** Outcome status */
  status_id?: number;
  /** Status detail message */
  status_detail?: string;
  /**
   * Unmapped fields for extensions (hash chain)
   * OCSF allows custom fields in unmapped object
   */
  unmapped?: {
    /** Sequence number for ordering */
    seq: number;
    /** SHA-256 hash of previous event */
    prev_hash: string;
    /** SHA-256 hash of this event */
    hash: string;
  };
}

// ============================================================================
// OCSF Event Classes
// ============================================================================

/**
 * OCSF Authentication Event (Class 3002)
 * Used for login, logout, and authentication attempts
 */
export interface OCSFAuthenticationEvent extends OCSFBaseEvent {
  category_uid: 3;
  class_uid: 3002;
  /** Target user being authenticated */
  user: OCSFUser;
  /** Source endpoint (client) */
  src_endpoint?: OCSFEndpoint;
  /** Destination endpoint (server) */
  dst_endpoint?: OCSFEndpoint;
  /** Authentication protocol ID */
  auth_protocol_id?: number;
  /** Authentication protocol name */
  auth_protocol?: string;
  /** Is multi-factor authentication */
  is_mfa?: boolean;
  /** Logon type ID */
  logon_type_id?: number;
  /** Session info */
  session?: OCSFSession;
}

/**
 * OCSF Account Change Event (Class 3001)
 * Used for user creation, updates, password changes, role changes
 */
export interface OCSFAccountChangeEvent extends OCSFBaseEvent {
  category_uid: 3;
  class_uid: 3001;
  /** Target user being modified */
  user: OCSFUser;
  /** Actor who made the change */
  actor?: OCSFActor;
  /** Source endpoint */
  src_endpoint?: OCSFEndpoint;
}

/**
 * OCSF API Activity Event (Class 6003)
 * Used for API access logging, payment events, order events
 */
export interface OCSFApiActivityEvent extends OCSFBaseEvent {
  category_uid: 6;
  class_uid: 6003;
  /** Actor who made the API call */
  actor: OCSFActor;
  /** API details */
  api: OCSFApi;
  /** Source endpoint */
  src_endpoint?: OCSFEndpoint;
  /** Destination endpoint */
  dst_endpoint?: OCSFEndpoint;
  /** HTTP request info */
  http_request?: {
    http_method?: string;
    url?: {
      path?: string;
    };
  };
}

// ============================================================================
// Union Type
// ============================================================================

/**
 * Any OCSF event type
 */
export type OCSFEvent = OCSFAuthenticationEvent | OCSFAccountChangeEvent | OCSFApiActivityEvent;
