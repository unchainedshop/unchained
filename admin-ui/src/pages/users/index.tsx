import { useIntl } from 'react-intl';
import { useRouter } from 'next/router';
import UserList from '../../modules/accounts/components/UserList';
import useUsers from '../../modules/accounts/hooks/useUsers';
import BreadCrumbs from '../../modules/common/components/BreadCrumbs';
import InfiniteScroll from '../../modules/common/components/InfiniteScroll';
import Loading from '../../modules/common/components/Loading';
import PageHeader from '../../modules/common/components/PageHeader';
import Toggle from '../../modules/common/components/Toggle';
import { DefaultLimit } from '../../modules/common/data/miscellaneous';
import ListHeader from '../../modules/common/components/ListHeader';
import UserFilter from '../../modules/accounts/components/UserFilter';
import NoData from '../../modules/common/components/NoData';
import SearchWithTags from '../../modules/common/components/SearchWithTags';
import UserDetailPage from './UserDetailPage';
import AnimatedCounter from '../../modules/common/components/AnimatedCounter';
import useApp from '../../modules/common/hooks/useApp';
import useAuth from '../../modules/Auth/useAuth';
import { IRoleAction } from '../../gql/types';

const Users = () => {
  const { formatMessage } = useIntl();
  const { query, push, isReady } = useRouter();
  const { shopInfo } = useApp();
  const { queryString, tags, userId, ...rest } = query;
  const { hasRole } = useAuth();

  const setQueryString = (searchString) => {
    const { skip, ...withoutSkip } = rest || { skip: null };
    if (searchString)
      push({
        query: {
          ...withoutSkip,
          queryString: searchString,
        },
      });
    else
      push({
        query: {
          ...rest,
        },
      });
  };

  const limit = parseInt(query?.limit as string, 10) || DefaultLimit;
  const offset = parseInt(query?.skip as string, 10) || 0;
  const includeGuests = query?.includeGuests === 'true';
  let emailVerified = null;
  if (query?.emailVerified === 'true') {
    emailVerified = true;
  } else if (query?.emailVerified === 'false') {
    emailVerified = false;
  }

  const lastLogin = (query?.start || query?.end) && {
    start: query?.start as string,
    end: query?.end as string,
  };

  const { users, usersCount, loading, loadMore, hasMore } = useUsers({
    limit,
    includeGuests,
    queryString: queryString as string,
    offset,
    lastLogin,
    emailVerified,
    tags: tags as string[],
  });
  if (!isReady) {
    return null; // or a loading spinner
  }

  if (userId) return <UserDetailPage userId={userId} />;

  const headerText =
    usersCount === 1
      ? formatMessage({
          id: 'user_header',
          defaultMessage: '1 User',
        })
      : formatMessage(
          {
            id: 'user_count_header',
            defaultMessage: '{count} Users',
          },
          { count: <AnimatedCounter value={usersCount} /> },
        );

  return (
    <div className="mb-10">
      <BreadCrumbs />
      <PageHeader
        title={formatMessage(
          {
            id: 'user_page_title',
            defaultMessage: '{count, plural, one {# User} other {# Users}}',
          },
          { count: usersCount },
        )}
        headerText={headerText}
        addPath={hasRole(IRoleAction.EnrollUser) ? '/users/new' : undefined}
        addButtonText={formatMessage({
          id: 'add_user',
          defaultMessage: 'Add User',
        })}
      />
      <UserFilter />
      <ListHeader>
        <Toggle
          toggleKey="includeGuests"
          toggleText={formatMessage({
            id: 'show_guests',
            defaultMessage: 'Show Guests',
          })}
        />
      </ListHeader>

      <SearchWithTags
        onSearchChange={setQueryString}
        defaultSearchValue={queryString}
        showTagFilter
        availableTagOptions={(shopInfo?.adminUiConfig?.userTags || []).map(
          (tag) => ({ label: tag, value: tag }),
        )}
      >
        <InfiniteScroll
          loading={loading}
          hasMore={hasMore}
          onLoadMore={loadMore}
        >
          {loading && users?.length === 0 ? (
            <Loading />
          ) : (
            <UserList users={users} />
          )}
          {!loading && !users?.length && (
            <NoData
              message={formatMessage({
                id: 'user',
                defaultMessage: 'User',
              })}
            />
          )}
        </InfiniteScroll>
      </SearchWithTags>
    </div>
  );
};

export default Users;
