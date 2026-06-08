import { log } from '@unchainedshop/logger';
import { OCSF_CLASS, type OCSFEvent, type OCSFUser, type OCSFActor } from '@unchainedshop/events';
import type { Context } from '../../../context.ts';

const CLASS_NAMES: Record<number, string> = {
  [OCSF_CLASS.ACCOUNT_CHANGE]: 'ACCOUNT_CHANGE',
  [OCSF_CLASS.AUTHENTICATION]: 'AUTHENTICATION',
  [OCSF_CLASS.API_ACTIVITY]: 'API_ACTIVITY',
};

function mapUser(user?: OCSFUser) {
  if (!user) return undefined;
  return {
    uid: user.uid,
    name: user.name,
    emailAddr: user.email_addr,
  };
}

function mapActor(
  event: OCSFEvent,
): { user?: ReturnType<typeof mapUser>; session?: { uid?: string } } | undefined {
  if ('actor' in event && (event as any).actor) {
    const actor = (event as any).actor as OCSFActor;
    return {
      user: mapUser(actor.user),
      session: actor.session ? { uid: actor.session.uid } : undefined,
    };
  }
  if ('user' in event && (event as any).user) {
    return {
      user: mapUser((event as any).user as OCSFUser),
      session:
        'session' in event && (event as any).session ? { uid: (event as any).session.uid } : undefined,
    };
  }
  return undefined;
}

function mapEndpoint(ep?: { ip?: string; port?: number }) {
  if (!ep) return undefined;
  return { ip: ep.ip, port: ep.port };
}

export function mapAuditEntry(event: OCSFEvent) {
  return {
    id: event.unmapped?.hash || `${event.time}-${event.unmapped?.seq}`,
    time: event.time,
    message: event.message,
    classUid: event.class_uid,
    className: CLASS_NAMES[event.class_uid] || 'UNKNOWN',
    activityId: event.activity_id,
    activityName: event.message,
    typeUid: event.type_uid,
    categoryUid: event.category_uid,
    severityId: event.severity_id,
    statusId: event.status_id ?? 0,
    statusDetail: event.status_detail,
    actor: mapActor(event),
    srcEndpoint: mapEndpoint('src_endpoint' in event ? (event as any).src_endpoint : undefined),
    dstEndpoint: mapEndpoint('dst_endpoint' in event ? (event as any).dst_endpoint : undefined),
    api: 'api' in event ? (event as any).api : undefined,
    metadata: event.metadata,
    sequenceNumber: event.unmapped?.seq,
    prevHash: event.unmapped?.prev_hash,
    hash: event.unmapped?.hash,
    raw: event,
  };
}

export default async function auditLogs(
  _root: never,
  params: {
    limit?: number;
    offset?: number;
    classUids?: number[];
    userId?: string;
    success?: boolean;
    from?: number;
    until?: number;
  },
  context: Context,
) {
  log(`query auditLogs limit: ${params.limit} offset: ${params.offset}`, { userId: context.userId });

  if (!context.auditLog) return [];

  const entries = await context.auditLog.find({
    limit: params.limit,
    offset: params.offset,
    classUids: params.classUids,
    userId: params.userId,
    success: params.success ?? undefined,
    startTime: params.from ? new Date(params.from) : undefined,
    endTime: params.until ? new Date(params.until) : undefined,
  });

  return entries.map(mapAuditEntry);
}
