import { useRouter } from 'next/router';
import useToken from '../../modules/token/hooks/useToken';
import BreadCrumbs from '../../modules/common/components/BreadCrumbs';
import PageHeader from '../../modules/common/components/PageHeader';
import { useIntl } from 'react-intl';
import Loading from '../../modules/common/components/Loading';
import TokenDetail from '../../modules/token/components/TokenDetail';
import ExportToken from '../../modules/accounts/components/ExportToken';
import HeaderDeleteButton from '../../modules/common/components/HeaderDeleteButton';
import DangerMessage from '../../modules/modal/components/DangerMessage';
import useModal from '../../modules/modal/hooks/useModal';
import useInvalidateTicket from '../../modules/token/hooks/useInvalidateTicket';
import { toast } from 'react-toastify';
import { useCallback } from 'react';
import useAuth from '../../modules/Auth/useAuth';

const TokenDetailPage = ({ tokenId }) => {
  const { formatMessage } = useIntl();
  const { setModal } = useModal();

  const { token, loading } = useToken({ tokenId: tokenId as string });
  const { invalidateTicket } = useInvalidateTicket();
  const { hasRole } = useAuth();

  const onInvalidateToken = useCallback(async () => {
    await setModal(
      <DangerMessage
        onCancelClick={() => setModal('')}
        message={formatMessage({
          id: 'delete_paymentProvider_confirmation',
          defaultMessage:
            'This action might cause inconsistencies with other data that relates to it. Are you sure you want to delete this Payment provider? ',
        })}
        onOkClick={async () => {
          setModal('');
          await invalidateTicket({ tokenId });
          toast.success(
            formatMessage({
              id: 'payment_provider_deleted',
              defaultMessage: 'Payment provider deleted successfully',
            }),
          );
        }}
        okText={formatMessage({
          id: 'delete_payment_provider',
          defaultMessage: 'Delete payment provider',
        })}
      />,
    );
  }, [tokenId]);

  if (loading) return <Loading />;
  return (
    <>
      <BreadCrumbs currentPageTitle={token?.chainTokenId} />
      <div className="items-center flex min-w-full justify-between gap-3 flex-wrap">
        <PageHeader
          headerText={formatMessage(
            {
              id: 'token-id',
              defaultMessage: 'Token ID {chainTokenId}',
            },
            { chainTokenId: token?.chainTokenId },
          )}
        >
          {token.status !== 'DECENTRALIZED' && hasRole('editToken') && (
            <div className="mr-2">
              <ExportToken tokenId={token._id} tokenStatus={token.status} />
            </div>
          )}
        </PageHeader>
        {!token.invalidatedDate &&
        token.isInvalidateable &&
        hasRole('editToken') ? (
          <HeaderDeleteButton
            onClick={onInvalidateToken}
            text={formatMessage({
              id: 'invalidate-token',
              defaultMessage: 'Invalidate',
            })}
          />
        ) : null}
      </div>
      <TokenDetail token={token} />
    </>
  );
};

export default TokenDetailPage;
