/**
 * OCSF → OTLP Logs Encoder & Exporter
 *
 * Converts OCSF audit events into OTLP/HTTP JSON log records and pushes them
 * to any OTLP-compatible collector (OpenTelemetry Collector, Vector, Fluent Bit,
 * vendor agents). No @opentelemetry dependencies — the OTLP/HTTP JSON contract
 * is small enough to encode directly (see otlp-types.ts).
 */

import { createLogger } from '@unchainedshop/logger';
import type {
  OCSFEvent,
  OCSFUser,
  OCSFApiActivityEvent,
  OCSFAuthenticationEvent,
} from './ocsf-types.ts';
import {
  OTLP_SEVERITY_NUMBER,
  type OTLPAnyValue,
  type OTLPKeyValue,
  type OTLPLogRecord,
  type OTLPExportLogsServiceRequest,
  type OTLPExportLogsServiceResponse,
} from './otlp-types.ts';

const logger = createLogger('unchained:audit');

/** OCSF severity_id → OTLP severityNumber */
const SEVERITY_NUMBER_MAP: Record<number, number> = {
  0: OTLP_SEVERITY_NUMBER.UNSPECIFIED,
  1: OTLP_SEVERITY_NUMBER.INFO,
  2: OTLP_SEVERITY_NUMBER.INFO2,
  3: OTLP_SEVERITY_NUMBER.WARN,
  4: OTLP_SEVERITY_NUMBER.ERROR,
  5: OTLP_SEVERITY_NUMBER.FATAL,
  6: OTLP_SEVERITY_NUMBER.FATAL4,
};

/** OCSF severity_id → original OCSF severity caption (OTLP severityText) */
const SEVERITY_TEXT_MAP: Record<number, string> = {
  0: 'Unknown',
  1: 'Informational',
  2: 'Low',
  3: 'Medium',
  4: 'High',
  5: 'Critical',
  6: 'Fatal',
};

export function toAnyValue(value: unknown): OTLPAnyValue {
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { boolValue: value };
  if (typeof value === 'bigint') return { intValue: value.toString() };
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) ? { intValue: String(value) } : { doubleValue: value };
  }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toAnyValue) } };
  if (value !== null && typeof value === 'object') {
    const values: OTLPKeyValue[] = [];
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (entry === undefined) continue;
      values.push({ key, value: toAnyValue(entry) });
    }
    return { kvlistValue: { values } };
  }
  // null and anything unrepresentable
  return { stringValue: String(value ?? null) };
}

function toMillisTimeUnixNano(timeMs: number): string {
  return (BigInt(Math.round(timeMs)) * 1_000_000n).toString();
}

export function encodeOCSFLogRecord(event: OCSFEvent, observedTimeMs: number): OTLPLogRecord {
  const attributes: OTLPKeyValue[] = [];
  const attr = (key: string, value: string | number | undefined) => {
    if (value === undefined) return;
    attributes.push({ key, value: toAnyValue(value) });
  };

  const user: OCSFUser | undefined =
    (event as OCSFAuthenticationEvent).user ?? (event as OCSFApiActivityEvent).actor?.user;
  const sessionId =
    (event as OCSFAuthenticationEvent).session?.uid ?? (event as any).actor?.session?.uid;

  attr('ocsf.class_uid', event.class_uid);
  attr('ocsf.category_uid', event.category_uid);
  attr('ocsf.activity_id', event.activity_id);
  attr('ocsf.type_uid', event.type_uid);
  attr('ocsf.severity_id', event.severity_id);
  attr('ocsf.status_id', event.status_id);
  attr('user.id', user?.uid);
  attr('user.name', user?.name);
  attr('client.address', event.src_endpoint?.ip);
  attr('session.id', sessionId);
  attr('ocsf.api.operation', (event as OCSFApiActivityEvent).api?.operation);
  attr('log.record.uid', event.metadata.uid);

  return {
    timeUnixNano: toMillisTimeUnixNano(event.time),
    observedTimeUnixNano: toMillisTimeUnixNano(observedTimeMs),
    severityNumber: SEVERITY_NUMBER_MAP[event.severity_id] ?? OTLP_SEVERITY_NUMBER.UNSPECIFIED,
    severityText: SEVERITY_TEXT_MAP[event.severity_id],
    body: toAnyValue(event),
    attributes,
  };
}

export function buildExportLogsRequest(
  events: OCSFEvent[],
  observedTimeMs: number = Date.now(),
): OTLPExportLogsServiceRequest {
  const resourceAttributes: OTLPKeyValue[] = [
    {
      key: 'service.name',
      value: toAnyValue(process.env.OTEL_SERVICE_NAME || 'unchained-engine'),
    },
  ];
  if (process.env.npm_package_version) {
    resourceAttributes.push({
      key: 'service.version',
      value: toAnyValue(process.env.npm_package_version),
    });
  }

  return {
    resourceLogs: [
      {
        resource: { attributes: resourceAttributes },
        scopeLogs: [
          {
            scope: { name: 'unchained:audit' },
            logRecords: events.map((event) => encodeOCSFLogRecord(event, observedTimeMs)),
          },
        ],
      },
    ],
  };
}

/**
 * Parses the OTEL_EXPORTER_OTLP_HEADERS "key1=value1,key2=value2" format
 * (values may be URL-encoded per the W3C baggage convention).
 */
export function parseOtlpHeaders(raw?: string): Record<string, string> {
  const headers: Record<string, string> = {};
  if (!raw) return headers;
  for (const pair of raw.split(',')) {
    const separatorIndex = pair.indexOf('=');
    if (separatorIndex <= 0) continue;
    const key = pair.slice(0, separatorIndex).trim();
    let value = pair.slice(separatorIndex + 1).trim();
    try {
      value = decodeURIComponent(value);
    } catch {
      // keep the raw value if it is not valid percent-encoding
    }
    if (key) headers[key] = value;
  }
  return headers;
}

/**
 * Resolves the OTLP logs endpoint: explicit config wins, then the standard
 * OTEL_EXPORTER_OTLP_LOGS_ENDPOINT (used verbatim), then
 * OTEL_EXPORTER_OTLP_ENDPOINT with the /v1/logs signal path appended.
 */
export function resolveCollectorUrl(explicit?: string): string | undefined {
  if (explicit) return explicit;
  if (process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT) {
    return process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT;
  }
  if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    return `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT.replace(/\/+$/, '')}/v1/logs`;
  }
  return undefined;
}

/** Standard env headers, overridden by logs-specific env, overridden by explicit config. */
export function resolveCollectorHeaders(explicit?: Record<string, string>): Record<string, string> {
  return {
    ...parseOtlpHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS),
    ...parseOtlpHeaders(process.env.OTEL_EXPORTER_OTLP_LOGS_HEADERS),
    ...explicit,
  };
}

export async function exportLogs(
  collectorUrl: string,
  collectorHeaders: Record<string, string>,
  events: OCSFEvent[],
): Promise<void> {
  const response = await fetch(collectorUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...collectorHeaders,
    },
    body: JSON.stringify(buildExportLogsRequest(events)),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  try {
    const body = (await response.json()) as OTLPExportLogsServiceResponse;
    const rejected = Number(body?.partialSuccess?.rejectedLogRecords || 0);
    if (rejected > 0) {
      logger.warn(
        `Collector rejected ${rejected} audit log records: ${body.partialSuccess?.errorMessage || 'unknown reason'}`,
      );
    }
  } catch {
    // empty or non-JSON success response is valid OTLP
  }
}
