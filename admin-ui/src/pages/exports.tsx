import useRecentExports from '../modules/work/hooks/useRecentExports';
import PageHeader from '../modules/common/components/PageHeader';
import BreadCrumbs from '../modules/common/components/BreadCrumbs';
import { useIntl } from 'react-intl';
import Table from '../modules/common/components/Table';
import Link from 'next/link';
import useFormatDateTime from '../modules/common/utils/useFormatDateTime';
import { convertSortFieldsToQueryFormat } from '../modules/common/utils/utils';
import { useRouter } from 'next/router';
import Accordion from '../modules/common/components/Accordion';

const RecentExports = () => {
  const { formatMessage } = useIntl();
  const timeFormatOptions: Intl.DateTimeFormatOptions = {
    dateStyle: 'short',
    timeStyle: 'short',
  };
  const { formatDateTime } = useFormatDateTime();
  const router = useRouter();
  const { query, pathname } = router;

  const sortOptions = convertSortFieldsToQueryFormat(query?.sort);
  const workId = query?.workId as string;
  const recentExports = useRecentExports({ sortOptions, queryString: workId });

  const handleShowAll = () => {
    const { workId: _, ...remainingQuery } = query;
    router.push({
      pathname,
      query: remainingQuery,
    });
  };
  const accordionData = (recentExports?.exports || []).map((batch) => ({
    header: (
      <div className="flex flex-1 justify-between items-center px-4 py-2 text-sm">
        <div className="flex flex-col items-start text-left">
          <span className="text-xs text-slate-400">
            {formatMessage({ id: 'id', defaultMessage: 'ID' })}{' '}
            {batch.id.slice(-6).toUpperCase()}
          </span>
          <span className="font-bold text-slate-700 dark:text-slate-100">
            {batch.type}
          </span>
        </div>
        <div className="flex flex-col items-start text-left">
          <span className="text-slate-600 dark:text-slate-300">
            {formatDateTime(batch.finished, timeFormatOptions)}
          </span>
          <span className="text-xs text-slate-400">
            {formatMessage({ id: 'exported', defaultMessage: 'Exported' })}
          </span>
        </div>
        <div className="bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold">
          {batch.files.length}{' '}
          {formatMessage({ id: 'files', defaultMessage: 'Files' })}
        </div>
      </div>
    ),
    body: (
      <Table className="min-w-full">
        <Table.Row header>
          <Table.Cell>
            {formatMessage({ id: 'file', defaultMessage: 'File' })}
          </Table.Cell>
          <Table.Cell>
            {formatMessage({ id: 'expires', defaultMessage: 'Expires' })}
          </Table.Cell>
          <Table.Cell>&nbsp;</Table.Cell>
        </Table.Row>
        {batch.files.map((file) => (
          <Table.Row key={file.url}>
            <Table.Cell className="font-medium">
              {file.name.replace(/([A-Z])/g, ' $1').trim()}
            </Table.Cell>
            <Table.Cell className="text-red-500 dark:text-red-400">
              {formatDateTime(file.expiresAt, timeFormatOptions)}
            </Table.Cell>
            <Table.Cell>
              <Link
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-bold underline"
              >
                {formatMessage({ id: 'download', defaultMessage: 'Download' })}
              </Link>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table>
    ),
  }));

  return (
    <>
      <BreadCrumbs
        depth={3}
        currentPageTitle={formatMessage({
          id: 'recent_exports',
          defaultMessage: 'Recent exports',
        })}
      />
      <div className="flex justify-between items-end mb-4">
        <PageHeader
          title={formatMessage(
            {
              id: 'recent_exports_page_title',
              defaultMessage:
                '{count, plural, one {# Export} other {# Exports}}',
            },
            { count: recentExports?.count || 0 },
          )}
          headerText={formatMessage(
            {
              id: 'recent_exports_page_title',
              defaultMessage:
                '{count, plural, one {# Export} other {# Exports}}',
            },
            { count: recentExports?.count || 0 },
          )}
        />
        {workId && (
          <button
            onClick={handleShowAll}
            className="text-sm font-semibold text-blue-600 hover:text-blue-800 mb-6 px-4 py-2 border rounded-md border-blue-200 bg-blue-50"
          >
            {formatMessage({
              id: 'show_all_exports',
              defaultMessage: 'Show all exports',
            })}
          </button>
        )}
      </div>

      {!recentExports?.count ? (
        <div className="p-10 text-center border-2 border-dashed rounded-xl">
          <p className="text-slate-500">
            {formatMessage({
              id: 'no_active_exports_found',
              defaultMessage:
                'No active files found or all links have expired.',
            })}
          </p>
          {workId && (
            <button
              onClick={handleShowAll}
              className="mt-4 text-blue-600 underline"
            >
              {formatMessage({
                id: 'clear_filter',
                defaultMessage: 'Clear filter',
              })}
            </button>
          )}
        </div>
      ) : (
        <Accordion
          data={accordionData}
          headerCSS="flex items-center rounded-lg shadow-sm"
          bodyCSS="bg-slate-50 dark:bg-slate-800/50 rounded-b-lg border-x border-b dark:border-slate-800"
        />
      )}
    </>
  );
};

export default RecentExports;
