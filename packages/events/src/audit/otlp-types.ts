/**
 * OTLP (OpenTelemetry Protocol) Logs Wire Types
 *
 * JSON encoding of the OTLP/HTTP logs contract per the proto3 JSON mapping:
 * field names are camelCase and int64 values are encoded as decimal strings.
 * https://opentelemetry.io/docs/specs/otlp/#json-protobuf-encoding
 */

export type OTLPAnyValue =
  | { stringValue: string }
  | { boolValue: boolean }
  | { intValue: string }
  | { doubleValue: number }
  | { arrayValue: { values: OTLPAnyValue[] } }
  | { kvlistValue: { values: OTLPKeyValue[] } };

export interface OTLPKeyValue {
  key: string;
  value: OTLPAnyValue;
}

export interface OTLPResource {
  attributes: OTLPKeyValue[];
}

export interface OTLPInstrumentationScope {
  name: string;
  version?: string;
}

/**
 * OTLP severity numbers (SeverityNumber enum)
 * https://opentelemetry.io/docs/specs/otel/logs/data-model/#field-severitynumber
 */
export const OTLP_SEVERITY_NUMBER = {
  UNSPECIFIED: 0,
  INFO: 9,
  INFO2: 10,
  WARN: 13,
  ERROR: 17,
  FATAL: 21,
  FATAL4: 24,
} as const;

export interface OTLPLogRecord {
  /** Event time in nanoseconds since Unix epoch (int64 as string) */
  timeUnixNano: string;
  /** Time the event was observed by the exporter (int64 as string) */
  observedTimeUnixNano: string;
  severityNumber: number;
  severityText?: string;
  body: OTLPAnyValue;
  attributes: OTLPKeyValue[];
}

export interface OTLPScopeLogs {
  scope: OTLPInstrumentationScope;
  logRecords: OTLPLogRecord[];
}

export interface OTLPResourceLogs {
  resource: OTLPResource;
  scopeLogs: OTLPScopeLogs[];
}

export interface OTLPExportLogsServiceRequest {
  resourceLogs: OTLPResourceLogs[];
}

export interface OTLPExportLogsServiceResponse {
  partialSuccess?: {
    rejectedLogRecords?: number | string;
    errorMessage?: string;
  };
}
