import { useState } from 'react';
import { useIntl } from 'react-intl';
import { useRouter } from 'next/router';
import BreadCrumbs from '@/components/ui/BreadCrumbs';
import PageHeader from '@/components/ui/PageHeader';
import Loading from '@/components/ui/Loading';
import InfiniteScroll from '../../modules/common/components/InfiniteScroll';
import ChainStatusBanner from '../../modules/audit/components/ChainStatusBanner';
import FailedLoginsWidget from '../../modules/audit/components/FailedLoginsWidget';
import AuditLogFilters from '../../modules/audit/components/AuditLogFilters';
import AuditLogTable from '../../modules/audit/components/AuditLogTable';
import AuditEntryDetail from '../../modules/audit/components/AuditEntryDetail';
import useAuditLogs from '../../modules/audit/hooks/useAuditLogs';

const SecurityPage = () => {
  const { formatMessage } = useIntl();
  const { query } = useRouter();
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  const classUids = query.classUid
    ? [parseInt(query.classUid as string, 10)]
    : null;
  const success =
    query.success === 'true' ? true : query.success === 'false' ? false : null;
  const userId = (query.userId as string) || null;

  const { auditLogs, auditLogsCount, loading, hasMore, loadMore } =
    useAuditLogs({
      limit: 50,
      classUids,
      success,
      userId,
    });

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
      />

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <ChainStatusBanner />
          <FailedLoginsWidget />
        </div>

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

          <AuditLogFilters />

          <div className="mt-4 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <InfiniteScroll
              loading={loading}
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
