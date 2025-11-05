import { useIntl } from 'react-intl';
import { IRoleAction } from '../../gql/types';

import { toast } from 'react-toastify';
import { useRouter } from 'next/router';
import useLanguages from '../../modules/language/hooks/useLanguages';
import LanguageList from '../../modules/language/components/LanguageList';
import useRemoveLanguage from '../../modules/language/hooks/useRemoveLanguage';
import { DefaultLimit } from '../../modules/common/data/miscellaneous';
import PageHeader from '../../modules/common/components/PageHeader';
import BreadCrumbs from '../../modules/common/components/BreadCrumbs';
import ListHeader from '../../modules/common/components/ListHeader';
import Toggle from '../../modules/common/components/Toggle';
import InfiniteScroll from '../../modules/common/components/InfiniteScroll';
import useModal from '../../modules/modal/hooks/useModal';
import DangerMessage from '../../modules/modal/components/DangerMessage';
import Loading from '../../modules/common/components/Loading';
import useAuth from '../../modules/Auth/useAuth';
import {
  convertSortFieldsToQueryFormat,
  normalizeQuery,
} from '../../modules/common/utils/utils';
import SearchWithTags from '../../modules/common/components/SearchWithTags';
import LanguageDetailPage from './LanguageDetailPage';
import AnimatedCounter from '../../modules/common/components/AnimatedCounter';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import InfoTextBanner from '../../modules/common/components/InfoTextBanner';

const Languages = () => {
  const { formatMessage } = useIntl();
  const { query, push } = useRouter();
  const { hasRole } = useAuth();
  const limit = parseInt(query?.limit as string, 10) || DefaultLimit;
  const offset = parseInt(query?.skip as string, 10) || 0;
  const includeInactive =
    query?.includeInactive === 'true' || !query?.includeInactive;
  const sort = query?.sort || '';
  const { queryString, languageId, ...restQuery } = query;

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

  const { languages, languagesCount, loading, loadMore, hasMore } =
    useLanguages({
      queryString: queryString as string,
      limit,
      includeInactive,
      offset,
      sort: sortKeys,
    });

  const { setModal } = useModal();
  const { removeLanguage } = useRemoveLanguage();

  if (languageId) return <LanguageDetailPage languageId={languageId} />;
  const onRemoveLanguage = async (languageId) => {
    await setModal(
      <DangerMessage
        onCancelClick={async () => setModal('')}
        message={formatMessage({
          id: 'delete_language_confirmation',
          defaultMessage:
            'This action might cause inconsistencies with other data that relates to it. Are you sure you want to delete this language? ',
        })}
        onOkClick={async () => {
          setModal('');
          await removeLanguage({ languageId });
          toast.success(
            formatMessage({
              id: 'language_deleted',
              defaultMessage: 'Language deleted successfully',
            }),
          );
        }}
        okText={formatMessage({
          id: 'delete_language',
          defaultMessage: 'Delete language',
        })}
      />,
    );
  };

  const headerText =
    languagesCount === 1
      ? formatMessage({
          id: 'language_header',
          defaultMessage: '1 Language',
        })
      : formatMessage(
          {
            id: 'language_count_header',
            defaultMessage: '{count} Languages',
          },
          { count: <AnimatedCounter value={languagesCount} /> },
        );

  return (
    <>
      <BreadCrumbs />
      <InfoTextBanner
        title={formatMessage({
          id: 'default_language_info_title',
          defaultMessage: 'About base language',
        })}
        description={formatMessage({
          id: 'default_language_info_description',
          defaultMessage:
            "If you support multiple languages, please set the base language by adjusting the environment variable UNCHAINED_LANG, for ex. UNCHAINED_LANG=en. That way, Unchained knows what localization needs to be sent if the user agent's language is unknown",
        })}
      />
      <PageHeader
        title={formatMessage(
          {
            id: 'language_page_title',
            defaultMessage:
              '{count, plural, one {# Language} other {# Languages}}',
          },
          { count: languagesCount },
        )}
        headerText={headerText}
        addPath={hasRole(IRoleAction.ManageLanguages) && '/language/new'}
        addButtonText={formatMessage({
          id: 'add_language',
          defaultMessage: 'Add Language',
        })}
      />

      <div className="min-w-full overflow-x-auto px-1">
        <ListHeader>
          <Toggle
            toggleText={formatMessage({
              id: 'show_inactive',
              defaultMessage: 'Show Inactive',
            })}
            toggleKey="includeInactive"
            active={includeInactive}
          />
        </ListHeader>
        <SearchWithTags
          onSearchChange={setQueryString}
          defaultSearchValue={queryString}
        >
          <InfiniteScroll
            loading={loading}
            hasMore={hasMore}
            onLoadMore={loadMore}
          >
            {loading && languages?.length === 0 ? (
              <Loading />
            ) : (
              <LanguageList
                sortable
                languages={languages}
                onRemoveLanguage={onRemoveLanguage}
              />
            )}
          </InfiniteScroll>
        </SearchWithTags>
      </div>
    </>
  );
};

export default Languages;
