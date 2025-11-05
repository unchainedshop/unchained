import { useRouter } from 'next/router';
import { IRoleAction } from '../../gql/types';

import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';

import BreadCrumbs from '../../modules/common/components/BreadCrumbs';
import PageHeader from '../../modules/common/components/PageHeader';
import usePaymentProvider from '../../modules/payment-providers/hooks/usePaymentProvider';
import useRemovePaymentProvider from '../../modules/payment-providers/hooks/useRemovePaymentProvider';
import useUpdatePaymentProvider from '../../modules/payment-providers/hooks/useUpdatePaymentProvider';
import Loading from '../../modules/common/components/Loading';
import DangerMessage from '../../modules/modal/components/DangerMessage';
import useModal from '../../modules/modal/hooks/useModal';
import ProviderDetail from '../../modules/common/components/ProviderDetail';
import HeaderDeleteButton from '../../modules/common/components/HeaderDeleteButton';
import { getInterfaceLabel } from '../../modules/common/utils/utils';
import useAuth from '../../modules/Auth/useAuth';

const PaymentProviderDetailPage = ({ paymentProviderId }) => {
  const { formatMessage } = useIntl();
  const { setModal } = useModal();
  const { push: routerPush, replace } = useRouter();
  const { hasRole } = useAuth();

  const { updatePaymentProvider } = useUpdatePaymentProvider();
  const { removePaymentProvider } = useRemovePaymentProvider();

  const { paymentProvider, loading } = usePaymentProvider({
    paymentProviderId: paymentProviderId as string,
  });

  const onSubmit = async ({ configuration: config }) => {
    await updatePaymentProvider({
      configuration: JSON.parse(config || '[]'),
      paymentProviderId,
    });
    return true;
  };

  const onSubmitSuccess = () => {
    replace('/payment-provider');
  };

  const handleOnClick = async () => {
    await setModal(
      <DangerMessage
        onCancelClick={async () => setModal('')}
        message={formatMessage({
          id: 'delete_payment_provider_confirmation',
          defaultMessage:
            'This action might cause inconsistencies with other data that relates to it. Are you sure you want to delete this payment provider? ',
        })}
        onOkClick={async () => {
          setModal('');
          await removePaymentProvider({
            paymentProviderId: paymentProviderId as string,
          });
          toast.success(
            formatMessage({
              id: 'payment_provider_deleted',
              defaultMessage: 'Payment provider deleted successfully',
            }),
          );
          routerPush('/payment-provider');
        }}
        okText={formatMessage({
          id: 'delete_payment_provider',
          defaultMessage: 'Delete payment provider',
        })}
      />,
    );
  };

  return (
    <>
      <BreadCrumbs
        currentPageTitle={getInterfaceLabel(paymentProvider?.interface)}
      />
      <div className="items-center flex min-w-full justify-between">
        <PageHeader
          headerText={formatMessage({
            id: 'update_payment_provider_header',
            defaultMessage: 'Update payment provider',
          })}
          title={formatMessage(
            {
              id: 'payment_detail_title',
              defaultMessage: 'Payment provider {id}',
            },
            { id: paymentProvider?._id },
          )}
        />
        {hasRole(IRoleAction.ManagePaymentProviders) && (
          <HeaderDeleteButton onClick={handleOnClick} />
        )}
      </div>
      {loading ? (
        <Loading />
      ) : (
        <ProviderDetail
          readOnly={!hasRole(IRoleAction.ManagePaymentProviders)}
          provider={paymentProvider}
          onSubmit={onSubmit}
          onSubmitSuccess={onSubmitSuccess}
        />
      )}
    </>
  );
};

export default PaymentProviderDetailPage;
