import useRecentExports from '../modules/work/hooks/useRecentExports';
import PageHeader from '../modules/common/components/PageHeader';
import BreadCrumbs from '../modules/common/components/BreadCrumbs';
import { useIntl } from 'react-intl';
import Table from '../modules/common/components/Table';
import Link from 'next/link';
import useFormatDateTime from '../modules/common/utils/useFormatDateTime';
import { convertSortFieldsToQueryFormat } from '../modules/common/utils/utils';
import { useRouter } from 'next/router';
import { ISortOptionInput } from '../gql/types';

const RecentExports = () => {
  const { formatMessage } = useIntl();
  const timeFormatOptions: Intl.DateTimeFormatOptions = {
    dateStyle: 'short',
    timeStyle: 'short',
  };
  const { formatDateTime } = useFormatDateTime();
  const { query } = useRouter();

  const sortOptions = convertSortFieldsToQueryFormat(query?.sort);

  const recentExports = useRecentExports({ sortOptions });
  return (
    <>
      <BreadCrumbs
        depth={3}
        currentPageTitle={formatMessage({
          id: 'recent_exports',
          defaultMessage: 'Recent exports',
        })}
      />
      <PageHeader
        title={formatMessage(
          {
            id: 'recent_exports_page_title',
            defaultMessage: '{count, plural, one {# Export} other {# Exports}}',
          },
          { count: recentExports?.count || 0 },
        )}
        headerText={formatMessage(
          {
            id: 'recent_exports_page_title',
            defaultMessage: '{count, plural, one {# Export} other {# Exports}}',
          },
          { count: recentExports?.count || 0 },
        )}
      />
      {!recentExports?.count ? (
        <p>
          {formatMessage({
            id: 'no_active_exports_found',
            defaultMessage: 'No active files found or all links have expired.',
          })}{' '}
        </p>
      ) : (
        <Table className="min-w-full ">
          <Table.Row header enablesort>
            <Table.Cell>
              {formatMessage({ id: 'file', defaultMessage: 'File' })}{' '}
            </Table.Cell>
            <Table.Cell sortKey="finished" defaultSortDirection="DESC">
              {formatMessage({ id: 'exported', defaultMessage: 'Exported' })}
            </Table.Cell>
            <Table.Cell>
              {formatMessage({ id: 'expires', defaultMessage: 'Expires' })}
            </Table.Cell>
            <Table.Cell>&nbsp;</Table.Cell>
          </Table.Row>

          {recentExports.files.map((file) => (
            <Table.Row key={file?.url}>
              <Table.Cell>
                {file.name.replaceAll('([A-Z])', ' $1').trim()}
              </Table.Cell>
              <Table.Cell>
                {formatDateTime(file.finished, timeFormatOptions)}
              </Table.Cell>
              <Table.Cell>
                {formatDateTime(file.expiresAt, timeFormatOptions)}
              </Table.Cell>
              <Table.Cell>
                <Link
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#007bff',
                    textDecoration: 'none',
                    fontWeight: '500',
                  }}
                >
                  {formatMessage({
                    id: 'download',
                    defaultMessage: 'Download',
                  })}
                </Link>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table>
      )}
    </>
  );
};

export default RecentExports;
