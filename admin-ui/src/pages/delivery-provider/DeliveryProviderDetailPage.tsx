import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';

import BreadCrumbs from '../../modules/common/components/BreadCrumbs';
import PageHeader from '../../modules/common/components/PageHeader';
import Loading from '../../modules/common/components/Loading';
import DangerMessage from '../../modules/modal/components/DangerMessage';
import useModal from '../../modules/modal/hooks/useModal';
import useRemoveDeliveryProvider from '../../modules/delivery-provider/hooks/useRemoveDeliveryProvider';
import useUpdateDeliveryProvider from '../../modules/delivery-provider/hooks/useUpdateDeliveryProvider';
import useDeliveryProvider from '../../modules/delivery-provider/hooks/useDeliveryProvider';
import ProviderDetail from '../../modules/common/components/ProviderDetail';
import HeaderDeleteButton from '../../modules/common/components/HeaderDeleteButton';
import { getInterfaceLabel } from '../../modules/common/utils/utils';
import useAuth from '../../modules/Auth/useAuth';

const DeliveryProviderDetailPage = ({ deliveryProviderId }) => {
  const { formatMessage } = useIntl();
  const { push: routerPush, replace } = useRouter();
  const { setModal } = useModal();
  const { hasRole } = useAuth();

  const { removeDeliveryProvider } = useRemoveDeliveryProvider();
  const { updateDeliveryProvider } = useUpdateDeliveryProvider();

  const { deliveryProvider, loading } = useDeliveryProvider({
    deliveryProviderId: deliveryProviderId as string,
  });

  const onSubmit = async ({ configuration: config }) => {
    await updateDeliveryProvider({
      deliveryProvider: {
        configuration: JSON.parse(config || '[]'),
      },
      deliveryProviderId: deliveryProviderId as string,
    });
    return true;
  };

  const onSubmitSuccess = () => {
    replace('/delivery-provider');
  };

  const handleOnClick = async () => {
    await setModal(
      <DangerMessage
        onCancelClick={async () => setModal('')}
        message={formatMessage({
          id: 'delete_delivery_provider_confirmation',
          defaultMessage:
            'This action might cause inconsistencies with other data that relates to it. Are you sure you want to delete this delivery provider?',
        })}
        onOkClick={async () => {
          await setModal('');
          await removeDeliveryProvider({
            deliveryProviderId: deliveryProviderId as string,
          });
          toast.success(
            formatMessage({
              id: 'delivery_provider_deleted',
              defaultMessage: 'Delivery provider deleted successfully',
            }),
          );
          routerPush('/delivery-provider');
        }}
        okText={formatMessage({
          id: 'delete_delivery_provider',
          defaultMessage: 'Delete delivery provider',
        })}
      />,
    );
  };

  return (
    <>
      <BreadCrumbs
        currentPageTitle={getInterfaceLabel(deliveryProvider?.interface)}
      />
      <div className="items-center flex min-w-full justify-between gap-3 flex-wrap">
        <PageHeader
          headerText={formatMessage({
            id: 'update_delivery_configuration',
            defaultMessage: 'Update delivery provider',
          })}
          title={formatMessage(
            {
              id: 'delivery_provider_title',
              defaultMessage: 'Delivery provider {id}',
            },
            { id: deliveryProvider?._id },
          )}
        />
        {hasRole('removeDeliveryProvider') && (
          <HeaderDeleteButton onClick={handleOnClick} />
        )}
      </div>
      {loading ? (
        <Loading />
      ) : (
        <ProviderDetail
          readOnly={!hasRole('editDeliveryProvider')}
          provider={deliveryProvider}
          onSubmit={onSubmit}
          onSubmitSuccess={onSubmitSuccess}
        />
      )}
    </>
  );
};

export default DeliveryProviderDetailPage;
