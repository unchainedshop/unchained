import { useIntl } from 'react-intl';
import { useRouter } from 'next/router';

import BreadCrumbs from '../../modules/common/components/BreadCrumbs';
import ListHeader from '../../modules/common/components/ListHeader';
import TagList from '../../modules/tags/components/TagList';

import {
  convertSortFieldsToQueryFormat,
  normalizeQuery,
} from '../../modules/common/utils/utils';
import SearchWithTags from '../../modules/common/components/SearchWithTags';
import Loading from '../../modules/common/components/Loading';
import useApp from '../../modules/common/hooks/useApp';
import PageHeader from '../../modules/common/components/PageHeader';
import AnimatedCounter from '../../modules/common/components/AnimatedCounter';

const Tags = () => {
  const { formatMessage } = useIntl();
  const { query, push } = useRouter();
  const { shopInfo } = useApp();
  const sort = query?.sort || '';

  const { queryString, tagId, ...restQuery } = query;

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

  const tags = shopInfo
    ? Array.from(
        new Set([
          ...(shopInfo.adminUiConfig?.productTags || []),
          ...(shopInfo?.adminUiConfig?.assortmentTags || []),
        ]),
      ).filter(Boolean)
    : [];
  const filteredTags = queryString
    ? tags?.filter((tag) =>
        tag.toLowerCase().includes((queryString as string).toLowerCase() || ''),
      )
    : tags;
  return (
    <>
      <BreadCrumbs />
      <PageHeader
        headerText={formatMessage(
          (filteredTags?.length ?? 0) === 1
            ? {
                id: 'tag_count_header_singular',
                defaultMessage: '1 Tag',
              }
            : {
                id: 'tags_count_header',
                defaultMessage: '{count} Tags',
              },
          { count: <AnimatedCounter value={filteredTags?.length ?? 0} /> },
        )}
      />
      <div className="min-w-full overflow-x-auto px-1">
        <ListHeader>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {formatMessage({
              id: 'tags_management_description',
              defaultMessage:
                'Manage tags used across products, assortments, and other content',
            })}
          </div>
        </ListHeader>

        <SearchWithTags
          onSearchChange={setQueryString}
          defaultSearchValue={queryString}
        >
          {!shopInfo && filteredTags?.length === 0 ? (
            <Loading />
          ) : (
            <TagList tags={filteredTags} sortable />
          )}
        </SearchWithTags>
      </div>
    </>
  );
};

export default Tags;