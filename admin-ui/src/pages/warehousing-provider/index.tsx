import { useRouter } from 'next/router';

import { IRoleAction } from '../../gql/types';

import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import { IWarehousingProviderType } from '../../gql/types';
import useAuth from '../../modules/Auth/useAuth';
import BreadCrumbs from '../../modules/common/components/BreadCrumbs';
import ListHeader from '../../modules/common/components/ListHeader';
import Loading from '../../modules/common/components/Loading';
import PageHeader from '../../modules/common/components/PageHeader';
import ProvidersFilter from '../../modules/common/components/ProvidersFilter';

import ProvidersList from '../../modules/common/components/ProvidersList';
import DangerMessage from '../../modules/modal/components/DangerMessage';
import useModal from '../../modules/modal/hooks/useModal';
import useRemoveWarehousingProvider from '../../modules/warehousing-providers/hooks/useRemoveWarehousingProvider';
import useWarehousingProviders from '../../modules/warehousing-providers/hooks/useWarehousingProviders';
import useWarehousingProviderTypes from '../../modules/warehousing-providers/hooks/useWarehousingProviderTypes';
import WarehousingProviderDetailPage from './WarehousingProviderDetailPage';

const WarehousingProviders = () => {
  const { formatMessage } = useIntl();
  const router = useRouter();
  const { query } = router;
  const { type, warehousingProviderId } = query;
  const { warehousingProviders, warehousingProvidersCount, loading } =
    useWarehousingProviders({
      type: type as IWarehousingProviderType,
    });
  const { removeWarehousingProvider } = useRemoveWarehousingProvider();
  const { warehousingProviderType } = useWarehousingProviderTypes();
  const { setModal } = useModal();
  const { hasRole } = useAuth();

  const onRemoveWarehousingProvider = async (warehousingProviderId) => {
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
          await removeWarehousingProvider({ warehousingProviderId });
          toast.success(
            formatMessage({
              id: 'warehousing_provider_deleted',
              defaultMessage: 'Warehousing provider deleted successfully',
            }),
          );
        }}
        okText={formatMessage({
          id: 'delete_warehousing_provider',
          defaultMessage: 'Delete warehousing Provider',
        })}
      />,
    );

    return true;
  };

  if (warehousingProviderId)
    return (
      <WarehousingProviderDetailPage
        warehousingProviderId={warehousingProviderId}
      />
    );
  return (
    <>
      <BreadCrumbs />
      <PageHeader
        headerText={formatMessage(
          (warehousingProvidersCount ?? 0) === 1
            ? {
                id: 'warehousing_provider_count_header_singular',
                defaultMessage: '1 Warehousing Provider',
              }
            : {
                id: 'warehousing_providers_count_header',
                defaultMessage: '{count} Warehousing Providers',
              },
          { count: warehousingProvidersCount ?? 0 },
        )}
        addPath={
          hasRole(IRoleAction.ManageWarehousingProviders) &&
          '/warehousing-provider/new'
        }
        addButtonText={formatMessage({
          id: 'add_warehousing_provider',
          defaultMessage: 'Add Warehousing Provider',
        })}
      />
      <ListHeader>
        <ProvidersFilter
          providerType={warehousingProviderType?.map(({ value }) => value)}
        />
      </ListHeader>
      {loading ? (
        <Loading />
      ) : (
        <ProvidersList
          providerPath="/warehousing-provider?warehousingProviderId"
          providers={warehousingProviders}
          onRemove={onRemoveWarehousingProvider}
          canDelete={hasRole(IRoleAction.ManageWarehousingProviders)}
          canEdit={hasRole(IRoleAction.ViewWarehousingProvider)}
        />
      )}
    </>
  );
};

export default WarehousingProviders;
