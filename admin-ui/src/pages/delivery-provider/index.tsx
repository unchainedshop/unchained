import { useRouter } from 'next/router';

import { IRoleAction } from '../../gql/types';

import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import { IDeliveryProviderType } from '../../gql/types';
import useAuth from '../../modules/Auth/useAuth';

import BreadCrumbs from '../../modules/common/components/BreadCrumbs';
import ListHeader from '../../modules/common/components/ListHeader';
import Loading from '../../modules/common/components/Loading';
import PageHeader from '../../modules/common/components/PageHeader';
import ProvidersFilter from '../../modules/common/components/ProvidersFilter';
import ProvidersList from '../../modules/common/components/ProvidersList';
import useDeliveryProviders from '../../modules/delivery-provider/hooks/useDeliveryProviders';
import useDeliveryProviderTypes from '../../modules/delivery-provider/hooks/useDeliveryProviderTypes';
import useRemoveDeliveryProvider from '../../modules/delivery-provider/hooks/useRemoveDeliveryProvider';
import DangerMessage from '../../modules/modal/components/DangerMessage';
import useModal from '../../modules/modal/hooks/useModal';
import DeliveryProviderDetailPage from './DeliveryProviderDetailPage';

const DeliveryProviders = () => {
  const router = useRouter();
  const { query } = router;
  const { type, deliveryProviderId } = query;

  const { formatMessage } = useIntl();
  const { hasRole } = useAuth();
  const { deliveryProviders, deliveryProvidersCount, loading } =
    useDeliveryProviders({
      type: type as IDeliveryProviderType,
    });
  const { setModal } = useModal();
  const { removeDeliveryProvider } = useRemoveDeliveryProvider();
  const { deliveryProviderType } = useDeliveryProviderTypes();
  const onRemoveDeliveryProvider = async (deliveryProviderId) => {
    await setModal(
      <DangerMessage
        onCancelClick={async () => setModal('')}
        message={formatMessage({
          id: 'delete_delivery_provider_confirmation',
          defaultMessage:
            'This action might cause inconsistencies with other data that relates to it. Are you sure you want to delete this delivery provider?',
        })}
        onOkClick={async () => {
          setModal('');
          await removeDeliveryProvider({ deliveryProviderId });
          toast.success(
            formatMessage({
              id: 'deliveryProviders_deleted',
              defaultMessage: 'DeliveryProviders deleted successfully',
            }),
          );
        }}
        okText={formatMessage({
          id: 'delete_delivery_provider',
          defaultMessage: 'Delete delivery provider',
        })}
      />,
    );
  };

  if (deliveryProviderId)
    return (
      <DeliveryProviderDetailPage deliveryProviderId={deliveryProviderId} />
    );
  return (
    <>
      <BreadCrumbs />
      <PageHeader
        headerText={formatMessage(
          (deliveryProvidersCount ?? 0) === 1
            ? {
                id: 'delivery_provider_count_header_singular',
                defaultMessage: '1 Delivery Provider',
              }
            : {
                id: 'delivery_providers_count_header',
                defaultMessage: '{count} Delivery Providers',
              },
          { count: deliveryProvidersCount ?? 0 },
        )}
        addPath={
          hasRole(IRoleAction.ManageDeliveryProviders) &&
          '/delivery-provider/new'
        }
        addButtonText={formatMessage({
          id: 'add_delivery_provider',
          defaultMessage: 'Add Delivery Provider',
        })}
      />
      <ListHeader>
        <ProvidersFilter
          providerType={deliveryProviderType?.map(({ value }) => value)}
        />
      </ListHeader>
      {loading ? (
        <Loading />
      ) : (
        <ProvidersList
          canEdit={hasRole(IRoleAction.ViewDeliveryProvider)}
          canDelete={hasRole(IRoleAction.ManageDeliveryProviders)}
          providerPath="/delivery-provider?deliveryProviderId"
          providers={deliveryProviders}
          onRemove={onRemoveDeliveryProvider}
        />
      )}
    </>
  );
};

export default DeliveryProviders;
