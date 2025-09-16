import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';

import useAuth from '../../modules/Auth/useAuth';
import BreadCrumbs from '../../modules/common/components/BreadCrumbs';
import HeaderDeleteButton from '../../modules/common/components/HeaderDeleteButton';
import Loading from '../../modules/common/components/Loading';
import PageHeader from '../../modules/common/components/PageHeader';
import FilterDetail from '../../modules/filter/components/FilterDetail';
import useFilter from '../../modules/filter/hooks/useFilter';
import useRemoveFilter from '../../modules/filter/hooks/useRemoveFilter';
import DangerMessage from '../../modules/modal/components/DangerMessage';
import useModal from '../../modules/modal/hooks/useModal';

const FilterDetailPage = ({ filterId }) => {
  const { formatMessage } = useIntl();
  const { setModal } = useModal();
  const router = useRouter();

  const { filter, loading, extendedData } = useFilter({
    filterId: filterId as string,
  });
  const { hasRole } = useAuth();

  const { removeFilter } = useRemoveFilter();

  const onRemoveFilter = async () => {
    await setModal(
      <DangerMessage
        onCancelClick={async () => setModal('')}
        message={formatMessage({
          id: 'delete_filter_confirmation',
          defaultMessage:
            'This action might cause inconsistencies with other data that relates to it. Are you sure you want to delete this filter? ',
        })}
        onOkClick={async () => {
          setModal('');
          await removeFilter({ filterId: filterId as string });
          toast.success(
            formatMessage({
              id: 'filter_deleted',
              defaultMessage: 'Filter deleted successfully',
            }),
          );
          router.push('/filters');
        }}
        okText={formatMessage({
          id: 'delete_filter',
          defaultMessage: 'Delete filter',
        })}
      />,
    );
  };
  if (!filter && !loading) {
    router.push('/404');
    return null;
  }
  if (loading) return <Loading />;
  return (
    <div className="mt-5 max-w-full">
      <BreadCrumbs currentPageTitle={filter?.key} />
      <div className="items-center flex min-w-full justify-between gap-3 flex-wrap">
        <PageHeader
          headerText={formatMessage({
            id: 'filter_detail',
            defaultMessage: 'Filter Detail',
          })}
          title={formatMessage(
            {
              id: 'filter_detail_title',
              defaultMessage: 'Filter {id}',
            },
            { id: filter?._id },
          )}
        />
        {hasRole('removeFilter') && (
          <HeaderDeleteButton onClick={onRemoveFilter} />
        )}
      </div>

      <FilterDetail filter={filter} extendedData={extendedData} />
    </div>
  );
};

export default FilterDetailPage;
