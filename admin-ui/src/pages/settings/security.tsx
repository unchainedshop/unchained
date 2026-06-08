import { useState, useCallback } from 'react';
import { useIntl } from 'react-intl';
import { useRouter } from 'next/router';
import BreadCrumbs from '@/components/ui/BreadCrumbs';
import PageHeader from '@/components/ui/PageHeader';
import Loading from '@/components/ui/Loading';
import Button from '@/components/ui/Button';
import InfiniteScroll from '../../modules/common/components/InfiniteScroll';
import ChainStatusBanner from '../../modules/audit/components/ChainStatusBanner';
import FailedLoginsWidget from '../../modules/audit/components/FailedLoginsWidget';
import AuditLogFilters from '../../modules/audit/components/AuditLogFilters';
import AuditLogTable from '../../modules/audit/components/AuditLogTable';
import AuditEntryDetail from '../../modules/audit/components/AuditEntryDetail';
import useAuditLogs from '../../modules/audit/hooks/useAuditLogs';
import { useCSVExport } from '../../modules/common/hooks/useCSVExport';

const SecurityPage = () => {
  const { formatMessage } = useIntl();
  const { query } = useRouter();
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  const classUids = query.classUids
    ? (query.classUids as string).split(',').map((s) => parseInt(s, 10))
    : null;
  const success =
    query.success === 'true' ? true : query.success === 'false' ? false : null;
  const userId = (query.userId as string) || null;
  const queryText = (query.queryText as string) || null;
  const from = query.from ? new Date(query.from as string).getTime() : null;
  const until = query.until
    ? new Date(query.until as string).getTime() + 86400000
    : null;

  const { auditLogs, auditLogsCount, loading, loadingMore, hasMore, loadMore } =
    useAuditLogs({
      limit: 50,
      classUids,
      success,
      userId,
      queryText,
      from,
      until,
    });

  const { exportCSV, isExporting } = useCSVExport();

  const exportAuditLogs = useCallback(
    async (format: 'csv' | 'jsonl') => {
      await exportCSV({
        type: 'AUDIT_LOGS',
        exportCSV: format === 'csv',
        exportJSONL: format === 'jsonl',
        ...(classUids ? { classUids } : {}),
        ...(userId ? { userId } : {}),
        ...(success !== null ? { success } : {}),
        ...(from ? { from } : {}),
        ...(until ? { until } : {}),
        ...(queryText ? { queryText } : {}),
      });
    },
    [exportCSV, classUids, userId, success, from, until, queryText],
  );

  return (
    <>
      <BreadCrumbs />
      <PageHeader
        title={formatMessage({
          id: 'security_page_title',
          defaultMessage: 'Security & Audit Log',
        })}
        headerText={formatMessage({
          id: 'security_page_header',
          defaultMessage: 'Security & Audit Log',
        })}
      >
        <Button
          variant="secondary"
          text={
            isExporting
              ? formatMessage({
                  id: 'exporting',
                  defaultMessage: 'Exporting...',
                })
              : formatMessage({
                  id: 'export_csv',
                  defaultMessage: 'Export CSV',
                })
          }
          onClick={() => exportAuditLogs('csv')}
          disabled={isExporting || !auditLogsCount}
        />
        <Button
          variant="secondary"
          text={
            isExporting
              ? formatMessage({
                  id: 'exporting',
                  defaultMessage: 'Exporting...',
                })
              : formatMessage({
                  id: 'export_jsonl',
                  defaultMessage: 'Export JSONL',
                })
          }
          onClick={() => exportAuditLogs('jsonl')}
          disabled={isExporting || !auditLogsCount}
        />
      </PageHeader>

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <ChainStatusBanner />
          <FailedLoginsWidget />
        </div>

        <AuditLogFilters />

        <div>
          <h2 className="mb-3 text-lg font-semibold text-slate-800 dark:text-slate-200">
            {formatMessage(
              {
                id: 'audit_log_browser',
                defaultMessage: 'Audit Log ({count})',
              },
              { count: auditLogsCount ?? '...' },
            )}
          </h2>

          <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <InfiniteScroll
              loading={loadingMore}
              hasMore={hasMore}
              onLoadMore={loadMore}
            >
              {loading && auditLogs.length === 0 ? (
                <Loading />
              ) : (
                <AuditLogTable
                  entries={auditLogs}
                  onSelectEntry={setSelectedEntry}
                />
              )}
            </InfiniteScroll>
          </div>
        </div>
      </div>

      {selectedEntry && (
        <AuditEntryDetail
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </>
  );
};

export default SecurityPage;
