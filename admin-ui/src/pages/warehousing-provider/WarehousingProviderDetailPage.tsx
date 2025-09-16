import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';

import BreadCrumbs from '../../modules/common/components/BreadCrumbs';
import PageHeader from '../../modules/common/components/PageHeader';
import useRemoveWarehousingProvider from '../../modules/warehousing-providers/hooks/useRemoveWarehousingProvider';
import useUpdateWarehousingProvider from '../../modules/warehousing-providers/hooks/useUpdateWarehousingProvider';
import useWarehousingProvider from '../../modules/warehousing-providers/hooks/useWarehousingProvider';
import useModal from '../../modules/modal/hooks/useModal';
import ProviderDetail from '../../modules/common/components/ProviderDetail';
import Loading from '../../modules/common/components/Loading';
import DangerMessage from '../../modules/modal/components/DangerMessage';
import HeaderDeleteButton from '../../modules/common/components/HeaderDeleteButton';
import { getInterfaceLabel } from '../../modules/common/utils/utils';
import useAuth from '../../modules/Auth/useAuth';

const WarehousingProviderDetailPage = ({ warehousingProviderId }) => {
  const { formatMessage } = useIntl();
  const { setModal } = useModal();
  const { push: routerPush, query } = useRouter();
  const { hasRole } = useAuth();

  const { updateWarehousingProvider } = useUpdateWarehousingProvider();
  const { removeWarehousingProvider } = useRemoveWarehousingProvider();

  const { warehousingProvider, loading } = useWarehousingProvider({
    warehousingProviderId: warehousingProviderId as string,
  });
  const onSubmit = async ({ configuration: config }) => {
    await updateWarehousingProvider({
      warehousingProvider: {
        configuration: JSON.parse(config || '[]'),
      },
      warehousingProviderId: warehousingProviderId as string,
    });
    return true;
  };

  const onSubmitSuccess = () => {
    routerPush('/warehousing-provider');
  };

  const handleOnClick = async () => {
    await setModal(
      <DangerMessage
        onCancelClick={() => setModal('')}
        message={formatMessage({
          id: 'delete_warehousing_provider_confirmation',
          defaultMessage:
            'This action might cause inconsistencies with other data that relates to it. Are you sure you want to delete this warehousing provider? ',
        })}
        onOkClick={async () => {
          setModal('');
          await removeWarehousingProvider({
            warehousingProviderId: warehousingProviderId as string,
          });
          toast.success(
            formatMessage({
              id: 'warehousing_provider_deleted',
              defaultMessage: 'Warehousing provider deleted successfully',
            }),
          );
          routerPush('/warehousing-provider');
        }}
        okText={formatMessage({
          id: 'delete_warehousing_provider',
          defaultMessage: 'Delete warehousing Provider',
        })}
      />,
    );
  };

  return (
    <>
      <BreadCrumbs
        currentPageTitle={getInterfaceLabel(warehousingProvider?.interface)}
      />
      <div className="items-center flex min-w-full justify-between gap-3 flex-wrap">
        <PageHeader
          headerText={formatMessage({
            id: 'update_warehousing_provider_header',
            defaultMessage: 'Update warehousing provider',
          })}
          title={formatMessage(
            {
              id: 'warehouse_detail_title',
              defaultMessage: 'Warehouse {id}',
            },
            { id: warehousingProvider?._id },
          )}
        />
        {hasRole('removeWarehousingProvider') && (
          <HeaderDeleteButton onClick={handleOnClick} />
        )}
      </div>

      {loading ? (
        <Loading />
      ) : (
        <ProviderDetail
          readOnly={!hasRole('editWarehousingProvider')}
          provider={warehousingProvider}
          onSubmit={onSubmit}
          onSubmitSuccess={onSubmitSuccess}
        />
      )}
    </>
  );
};

export default WarehousingProviderDetailPage;
