import { useIntl } from 'react-intl';
import BreadCrumbs from '@/components/ui/BreadCrumbs';
import PageHeader from '@/components/ui/PageHeader';
import Loading from '@/components/ui/Loading';
import useTokens from '../../modules/token/hooks/useTokens';
import TokenList from '../../modules/token/components/TokenList';
import NoData from '@/components/ui/NoData';
import { useRouter } from 'next/router';
import ListHeader from '@/components/ui/ListHeader';
import SearchWithTags from '../../modules/common/components/SearchWithTags';
import TokenDetailPage from './TokenDetailPage';
import AnimatedCounter from '@/components/ui/AnimatedCounter';

const TokensPage = () => {
  const { formatMessage } = useIntl();
  const { query, push } = useRouter();

  const { queryString, tokenId, ...rest } = query;

  const setQueryString = (searchString) => {
    const { skip, ...withoutSkip } = rest;
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
  const { tokens, loading, tokensCount } = useTokens({
    limit: 0,
    offset: 0,
    queryString: queryString as string,
  });

  if (tokenId) return <TokenDetailPage tokenId={tokenId} />;

  const headerText =
    tokensCount === 1
      ? formatMessage({
          id: 'token_header',
          defaultMessage: '1 Token',
        })
      : formatMessage(
          {
            id: 'token_count_header',
            defaultMessage: '{count} Tokens',
          },
          { count: <AnimatedCounter value={tokensCount} /> },
        );
  return (
    <>
      <BreadCrumbs />
      <PageHeader
        title={formatMessage(
          {
            id: 'token_page_title',
            defaultMessage: '{count, plural, one {# Token} other {# Tokens}}',
          },
          { count: tokensCount },
        )}
        headerText={headerText}
      />
      <div className="mt-5 inline-block min-w-full overflow-x-auto px-1 pb-5">
        <ListHeader />

        <SearchWithTags
          onSearchChange={setQueryString}
          defaultSearchValue={queryString}
        >
          <>
            {loading ? <Loading /> : <TokenList tokens={tokens} />}
            {!loading && !tokens?.length && (
              <NoData
                message={formatMessage({
                  id: 'token',
                  defaultMessage: 'Token',
                })}
              />
            )}
          </>
        </SearchWithTags>
      </div>
    </>
  );
};

export default TokensPage;
