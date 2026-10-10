import { useIntl } from 'react-intl';
import { useRouter } from 'next/router';
import { ListBulletIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import BreadCrumbs from '@/components/ui/BreadCrumbs';

import InfiniteScroll from '../../modules/common/components/InfiniteScroll';
import Loading from '@/components/ui/Loading';
import PageHeader from '@/components/ui/PageHeader';
import { DefaultLimit } from '../../modules/common/data/miscellaneous';
import MediaList from '../../modules/media/components/MediaList';
import MediaGrid from '../../modules/media/components/MediaGrid';
import useMedias from '../../modules/media/hooks/useMedias';
import MultipleSelect from '../../modules/common/components/MultipleSelect';
import { extractQuery } from '../../modules/common/utils/normalizeFilterKeys';
import {
  convertSortFieldsToQueryFormat,
  normalizeQuery,
} from '../../modules/common/utils/utils';
import ListHeader from '@/components/ui/ListHeader';
import SearchWithTags from '../../modules/common/components/SearchWithTags';
import MediaDetailPage from './MediaDetailPage';
import AnimatedCounter from '@/components/ui/AnimatedCounter';

const MEDIA_TYPE_OPTIONS = [
  { label: 'image', value: 'image' },
  { label: 'video', value: 'video' },
  { label: 'audio', value: 'audio' },
  { label: 'application', value: 'application' },
  { label: 'text', value: 'text' },
];

const Media = () => {
  const { formatMessage } = useIntl();
  const { query, push } = useRouter();
  const limit = parseInt(query?.limit as string, 10) || DefaultLimit;
  const offset = parseInt(query?.skip as string, 10) || 0;
  const sort = query?.sort || '';

  const viewMode = (query?.view as string) || 'grid';
  const { queryString, mediaId, ...restQuery } = query;

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

  const typeChangeHandler = (selectedTypes) => {
    const { types, ...rest } = query;
    if (selectedTypes?.length) {
      push({
        query: normalizeQuery(rest, selectedTypes?.join(','), 'types'),
      });
    } else {
      push({
        query: normalizeQuery(rest),
      });
    }
  };

  const { medias, mediasCount, loading, loadMore, hasMore } = useMedias({
    limit,
    offset,
    types: (query?.types as string)?.split(','),
    queryString: queryString as string,
    sort: sortKeys,
  });

  if (mediaId) return <MediaDetailPage mediaId={mediaId} />;

  const headerText =
    mediasCount === 1
      ? formatMessage({
          id: 'media_header',
          defaultMessage: '1 Media',
        })
      : formatMessage(
          {
            id: 'media_count_header',
            defaultMessage: '{count} Media',
          },
          { count: <AnimatedCounter value={mediasCount} /> },
        );

  return (
    <>
      <BreadCrumbs />
      <div className="w-full">
        <PageHeader
          title={formatMessage(
            {
              id: 'media_page_title',
              defaultMessage: '{count, plural, one {# Media} other {# Media}}',
            },
            { count: mediasCount },
          )}
          headerText={headerText}
        />
        <div>
          <div className="mt-4">
            <MultipleSelect
              label={formatMessage({
                id: 'select_type',
                defaultMessage: 'Select type',
              })}
              tagList={extractQuery(query?.types)}
              onChange={typeChangeHandler}
              options={MEDIA_TYPE_OPTIONS}
            />
          </div>
        </div>
      </div>
      <div className="min-w-full overflow-x-auto px-1">
        <div className="flex items-center justify-between">
          <ListHeader />
          <div className="flex items-center rounded-lg border border-border-default">
            <button
              type="button"
              onClick={() =>
                push({ query: { ...query, view: 'grid' } }, undefined, {
                  shallow: true,
                })
              }
              className={`rounded-l-lg p-2 ${viewMode === 'grid' ? 'bg-surface-secondary text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
            >
              <Squares2X2Icon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() =>
                push({ query: { ...query, view: 'list' } }, undefined, {
                  shallow: true,
                })
              }
              className={`rounded-r-lg p-2 ${viewMode === 'list' ? 'bg-surface-secondary text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
            >
              <ListBulletIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <SearchWithTags
          onSearchChange={setQueryString}
          defaultSearchValue={queryString}
        >
          <InfiniteScroll
            loading={loading}
            hasMore={hasMore}
            onLoadMore={loadMore}
          >
            {loading && medias?.length === 0 ? (
              <Loading variant="list" />
            ) : viewMode === 'grid' ? (
              <MediaGrid medias={medias} />
            ) : (
              <MediaList medias={medias} sortable />
            )}
          </InfiniteScroll>
        </SearchWithTags>
      </div>
    </>
  );
};

export default Media;
