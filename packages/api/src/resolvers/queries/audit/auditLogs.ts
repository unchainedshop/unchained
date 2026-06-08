import { log } from '@unchainedshop/logger';
import {
  OCSF_CLASS,
  type OCSFEvent,
  type OCSFUser,
  type OCSFAuthenticationEvent,
  type OCSFAccountChangeEvent,
  type OCSFApiActivityEvent,
} from '@unchainedshop/events';
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

function mapEndpoint(ep?: { ip?: string; port?: number }) {
  if (!ep) return undefined;
  return { ip: ep.ip, port: ep.port };
}

function extractActor(event: OCSFEvent) {
  switch (event.class_uid) {
    case OCSF_CLASS.API_ACTIVITY: {
      const e = event as OCSFApiActivityEvent;
      return {
        user: mapUser(e.actor?.user),
        session: e.actor?.session ? { uid: e.actor.session.uid } : undefined,
      };
    }
    case OCSF_CLASS.ACCOUNT_CHANGE: {
      const e = event as OCSFAccountChangeEvent;
      if (e.actor) {
        return {
          user: mapUser(e.actor.user),
          session: e.actor.session ? { uid: e.actor.session.uid } : undefined,
        };
      }
      return { user: mapUser(e.user), session: undefined };
    }
    case OCSF_CLASS.AUTHENTICATION: {
      const e = event as OCSFAuthenticationEvent;
      return {
        user: mapUser(e.user),
        session: e.session ? { uid: e.session.uid } : undefined,
      };
    }
    default:
      return undefined;
  }
}

export function mapAuditEntry(event: OCSFEvent) {
  const apiEvent =
    event.class_uid === OCSF_CLASS.API_ACTIVITY ? (event as OCSFApiActivityEvent) : undefined;

  return {
    id: event.unmapped?.hash || `${event.time}-${event.unmapped?.seq}`,
    time: event.time,
    message: event.message,
    classUid: event.class_uid,
    className: CLASS_NAMES[event.class_uid] || 'UNKNOWN',
    activityId: event.activity_id,
    activityName: apiEvent?.api?.operation || event.message,
    typeUid: event.type_uid,
    categoryUid: event.category_uid,
    severityId: event.severity_id,
    statusId: event.status_id ?? 0,
    statusDetail: event.status_detail,
    actor: extractActor(event),
    srcEndpoint:
      'src_endpoint' in event ? mapEndpoint(event.src_endpoint as { ip?: string }) : undefined,
    api: apiEvent?.api,
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
    queryText?: string;
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
    queryText: params.queryText || undefined,
  });

  return entries.map(mapAuditEntry);
}
