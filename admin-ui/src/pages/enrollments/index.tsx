import { useIntl } from 'react-intl';
import { useRouter } from 'next/router';

import BreadCrumbs from '../../modules/common/components/BreadCrumbs';
import ListHeader from '../../modules/common/components/ListHeader';
import InfiniteScroll from '../../modules/common/components/InfiniteScroll';
import Loading from '../../modules/common/components/Loading';
import PageHeader from '../../modules/common/components/PageHeader';
import { DefaultLimit } from '../../modules/common/data/miscellaneous';
import EnrollmentList from '../../modules/enrollment/components/EnrollmentList';
import useEnrollments from '../../modules/enrollment/hooks/useEnrollments';
import {
  convertSortFieldsToQueryFormat,
  normalizeQuery,
} from '../../modules/common/utils/utils';

import useEnrollmentStatusTypes from '../../modules/enrollment/hooks/useEnrollmentStatusTypes';
import StatusFilter from '../../modules/common/components/StatusFilter';
import SearchWithTags from '../../modules/common/components/SearchWithTags';
import EnrollmentDetailPage from './EnrollmentDetailPage';
import AnimatedCounter from '../../modules/common/components/AnimatedCounter';

const EnrollmentListView = () => {
  const { formatMessage } = useIntl();
  const { query, push } = useRouter();
  const limit = parseInt(query?.limit as string, 10) || DefaultLimit;
  const offset = parseInt(query?.skip as string, 10) || 0;
  const sort = query?.sort || '';

  const { queryString, enrollmentId, ...restQuery } = query;

  const setQueryString = (searchString) => {
    const { skip, ...withoutSkip } = restQuery;
    if (searchString) {
      push({
        query: normalizeQuery(withoutSkip, searchString, 'queryString'),
      });
    } else {
      push({
        query: normalizeQuery(restQuery),
      });
    }
  };

  const sortKeys = convertSortFieldsToQueryFormat(sort);

  const { enrollments, enrollmentsCount, loading, loadMore, hasMore } =
    useEnrollments({
      queryString: queryString as string,
      limit,
      offset,
      sort: sortKeys,
      status: (query?.status as string)?.split(','),
    });

  const { enrollmentStatusTypes } = useEnrollmentStatusTypes();

  const ENROLLMENT_STATUS =
    enrollmentStatusTypes?.map(({ value }) => value) || [];

  const onStatusChange = (currentStatuses) => {
    const { status, ...rest } = query;
    if (currentStatuses?.length)
      push({
        query: normalizeQuery(rest, currentStatuses, 'status'),
      });
    else
      push({
        query: rest,
      });
  };

  if (enrollmentId) return <EnrollmentDetailPage enrollmentId={enrollmentId} />;

  const headerText =
    enrollmentsCount === 1
      ? formatMessage({
          id: 'enrollment_header',
          defaultMessage: '1 Enrollment',
        })
      : formatMessage(
          {
            id: 'enrollment_count_header',
            defaultMessage: '{count} Enrollments',
          },
          { count: <AnimatedCounter value={enrollmentsCount} /> },
        );
  return (
    <>
      <BreadCrumbs />
      <PageHeader
        title={formatMessage(
          {
            id: 'enrollment_page_title',
            defaultMessage:
              '{count, plural, one {# Enrollment} other {# Enrollments}}',
          },
          { count: enrollmentsCount },
        )}
        headerText={headerText}
      />
      <div>
        <p className="mt-5 text-sm text-slate-400 dark:text-slate-200 lg:gap-7 lg:leading-6 ">
          {formatMessage({ id: 'status', defaultMessage: 'Status' })}
        </p>
        <div className="flex flex-wrap gap-10">
          <StatusFilter
            statuses={ENROLLMENT_STATUS}
            onStatusChange={onStatusChange}
            selectedStatuses={query?.status}
          />
        </div>
      </div>
      <div className="min-w-full overflow-x-auto px-1">
        <ListHeader />

        <SearchWithTags
          onSearchChange={setQueryString}
          defaultSearchValue={queryString}
        >
          <InfiniteScroll
            loading={loading}
            hasMore={hasMore}
            onLoadMore={loadMore}
          >
            {loading && enrollments?.length === 0 ? (
              <Loading />
            ) : (
              <EnrollmentList enrollments={enrollments} showUser sortable />
            )}
          </InfiniteScroll>
        </SearchWithTags>
      </div>
    </>
  );
};

export default EnrollmentListView;
