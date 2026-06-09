import type { UnchainedCore } from '../../core-index.ts';
import generateCSVFileAndURL, { type CSVFileResult } from './generateCSVFileAndUrl.ts';
import { EXPORTS_DIRECTORY } from '../createBulkExporter.ts';
import { z } from 'zod';
import { getAuditLogInstance } from '@unchainedshop/events';

export const AuditLogExportPayloadSchema = z.object({
  classUids: z.array(z.number()).optional(),
  userId: z.string().optional(),
  success: z.boolean().optional(),
  from: z.number().optional(),
  to: z.number().optional(),
  queryText: z.string().optional(),
  exportCSV: z.boolean().optional(),
  exportJSONL: z.boolean().optional(),
});

const AUDIT_CSV_HEADERS = [
  'time',
  'class_uid',
  'activity_id',
  'message',
  'user_name',
  'user_id',
  'ip',
  'operation',
  'status',
  'hash',
  'seq',
];

const MAX_EXPORT_ENTRIES = 50000;

async function uploadRawFile(
  content: string,
  fileName: string,
  unchainedAPI: UnchainedCore,
  expires = 3600000,
): Promise<CSVFileResult> {
  const uploaded = await unchainedAPI.services.files.uploadFileFromStream({
    directoryName: EXPORTS_DIRECTORY,
    rawFile: { filename: fileName, buffer: Buffer.from(content).toString('base64') },
    meta: { isPrivate: true },
  });
  const expiresAt = Date.now() + expires;
  const url = await unchainedAPI.services.files.createFileDownloadURL({
    file: uploaded,
    expires: expiresAt,
  });
  if (!url) throw new Error(`Failed to generate download URL for ${fileName}`);
  return { url, expires: expiresAt };
}

const exportAuditLogsHandler = async (
  params: Record<string, unknown>,
  _locales: string[],
  unchainedAPI: UnchainedCore,
) => {
  const auditLog = getAuditLogInstance();
  if (!auditLog) throw new Error('Audit log not configured');

  const payload = AuditLogExportPayloadSchema.parse(params);

  const entries = await auditLog.find({
    limit: MAX_EXPORT_ENTRIES,
    classUids: payload.classUids,
    userId: payload.userId,
    success: payload.success,
    startTime: payload.from ? new Date(payload.from) : undefined,
    endTime: payload.to ? new Date(payload.to) : undefined,
    queryText: payload.queryText,
  });

  const dateSlug = new Date().toISOString().slice(0, 10);

  const csvResult = payload.exportCSV
    ? await generateCSVFileAndURL({
        headers: AUDIT_CSV_HEADERS,
        rows: entries.map((event: any) => {
          const actor = event.actor?.user || event.user || {};
          const api = event.api || {};
          return {
            time: new Date(event.time).toISOString(),
            class_uid: event.class_uid,
            activity_id: event.activity_id,
            message: event.message || '',
            user_name: actor.name || actor.email_addr || '',
            user_id: actor.uid || '',
            ip: event.src_endpoint?.ip || '',
            operation: api.operation || '',
            status: event.status_id === 1 ? 'Success' : 'Failure',
            hash: event.unmapped?.hash || '',
            seq: event.unmapped?.seq || '',
          };
        }),
        directoryName: EXPORTS_DIRECTORY,
        fileName: `audit-log-${dateSlug}.csv`,
        unchainedAPI,
      })
    : null;

  const jsonlResult = payload.exportJSONL
    ? await uploadRawFile(
        entries.map((event: any) => JSON.stringify(event)).join('\n'),
        `audit-log-${dateSlug}.jsonl`,
        unchainedAPI,
      )
    : null;

  return {
    auditLogCSV: csvResult,
    auditLogJSONL: jsonlResult,
  };
};

export default exportAuditLogsHandler;

exportAuditLogsHandler.payloadSchema = AuditLogExportPayloadSchema;
