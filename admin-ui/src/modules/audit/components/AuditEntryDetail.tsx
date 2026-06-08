import { useIntl } from 'react-intl';
import { CLASS_LABELS, SEVERITY_LABELS, STATUS_LABELS } from './ocsf-labels';
import { XMarkIcon } from '@heroicons/react/24/outline';

const AuditEntryDetail = ({
  entry,
  onClose,
}: {
  entry: any;
  onClose: () => void;
}) => {
  const { formatMessage, formatDate, formatTime } = useIntl();

  if (!entry) return null;

  const sections = [
    {
      label: formatMessage({
        id: 'audit_detail_event',
        defaultMessage: 'Event',
      }),
      rows: [
        ['Class', CLASS_LABELS[entry.className] || entry.className],
        ['Type UID', entry.typeUid],
        ['Activity ID', entry.activityId],
        ['Severity', SEVERITY_LABELS[entry.severityId] || entry.severityId],
        ['Status', STATUS_LABELS[entry.statusId] || entry.statusId],
        entry.statusDetail && ['Status Detail', entry.statusDetail],
        ['Message', entry.message],
        [
          'Time',
          `${formatDate(entry.time, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })} ${formatTime(entry.time, {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}`,
        ],
      ].filter(Boolean),
    },
    entry.actor && {
      label: formatMessage({
        id: 'audit_detail_actor',
        defaultMessage: 'Actor',
      }),
      rows: [
        entry.actor.user?.uid && ['User ID', entry.actor.user.uid],
        entry.actor.user?.name && ['Name', entry.actor.user.name],
        entry.actor.user?.emailAddr && ['Email', entry.actor.user.emailAddr],
        entry.actor.session?.uid && ['Session', entry.actor.session.uid],
      ].filter(Boolean),
    },
    entry.srcEndpoint && {
      label: formatMessage({
        id: 'audit_detail_source',
        defaultMessage: 'Source Endpoint',
      }),
      rows: [
        entry.srcEndpoint.ip && ['IP', entry.srcEndpoint.ip],
        entry.srcEndpoint.port && ['Port', entry.srcEndpoint.port],
      ].filter(Boolean),
    },
    entry.api && {
      label: formatMessage({ id: 'audit_detail_api', defaultMessage: 'API' }),
      rows: [
        entry.api.operation && ['Operation', entry.api.operation],
        entry.api.request?.uid && ['Request ID', entry.api.request.uid],
        entry.api.response?.code && ['Response Code', entry.api.response.code],
      ].filter(Boolean),
    },
    {
      label: formatMessage({
        id: 'audit_detail_chain',
        defaultMessage: 'Hash Chain',
      }),
      rows: [
        ['Sequence #', entry.sequenceNumber],
        entry.hash && ['Hash', entry.hash],
        entry.prevHash && ['Previous Hash', entry.prevHash],
      ].filter(Boolean),
    },
  ].filter(Boolean);

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto border-l border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
      <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
          {formatMessage({
            id: 'audit_entry_detail',
            defaultMessage: 'Audit Entry Detail',
          })}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
      <div className="px-6 py-4 space-y-6">
        {sections.map((section: any, i) => (
          <div key={i}>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {section.label}
            </h3>
            <dl className="space-y-1">
              {section.rows.map(([key, value]: [string, any], j: number) => (
                <div
                  key={j}
                  className="flex justify-between gap-4 py-1 text-sm"
                >
                  <dt className="text-slate-500 dark:text-slate-400 shrink-0">
                    {key}
                  </dt>
                  <dd className="text-slate-800 dark:text-slate-200 text-right break-all">
                    {String(value ?? '—')}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {formatMessage({
              id: 'audit_detail_raw',
              defaultMessage: 'Raw OCSF Event',
            })}
          </h3>
          <pre className="overflow-x-auto rounded-md bg-slate-100 p-3 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {JSON.stringify(entry.raw, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default AuditEntryDetail;
