import { IRoleAction } from '../../gql/types';

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
import useCancelTicket from '../../modules/ticketing/hooks/useCancelTicket';
import { toast } from 'react-toastify';
import { useCallback } from 'react';
import useAuth from '../../modules/Auth/useAuth';

const TokenDetailPage = ({ tokenId }) => {
  const { formatMessage } = useIntl();
  const { setModal } = useModal();

  const { token: rawToken, loading } = useToken({ tokenId: tokenId as string });
  const token = rawToken as typeof rawToken & { isCanceled?: boolean };
  const { invalidateTicket } = useInvalidateTicket();
  const { cancelTicket } = useCancelTicket();
  const { hasRole } = useAuth();

  const onInvalidateToken = useCallback(async () => {
    await setModal(
      <DangerMessage
        onCancelClick={() => setModal('')}
        message={formatMessage({
          id: 'invalidate_token_confirmation',
          defaultMessage:
            'Are you sure you want to invalidate this token? This marks it as redeemed.',
        })}
        onOkClick={async () => {
          setModal('');
          await invalidateTicket({ tokenId });
          toast.success(
            formatMessage({
              id: 'token_invalidated',
              defaultMessage: 'Token invalidated successfully',
            }),
          );
        }}
        okText={formatMessage({
          id: 'invalidate_token',
          defaultMessage: 'Invalidate',
        })}
      />,
    );
  }, [tokenId]);

  const onCancelToken = useCallback(async () => {
    let generateDiscount = false;
    await setModal(
      <DangerMessage
        onCancelClick={() => setModal('')}
        message={
          <>
            {formatMessage({
              id: 'cancel_ticket_confirmation',
              defaultMessage:
                'Are you sure you want to cancel this ticket? This action cannot be undone.',
            })}
            <label className="mt-3 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                className="rounded border-slate-300 dark:border-slate-600"
                onChange={(e) => {
                  generateDiscount = e.target.checked;
                }}
              />
              {formatMessage({
                id: 'generate_discount_code',
                defaultMessage: 'Generate discount code for the user',
              })}
            </label>
          </>
        }
        onOkClick={async () => {
          setModal('');
          try {
            await cancelTicket({ tokenId, generateDiscount });
            toast.success(
              formatMessage({
                id: 'ticket_cancelled',
                defaultMessage: 'Ticket cancelled successfully',
              }),
            );
          } catch (e) {
            toast.error(e.message);
          }
        }}
        okText={formatMessage({
          id: 'cancel_ticket',
          defaultMessage: 'Cancel Ticket',
        })}
      />,
    );
  }, [tokenId]);

  if (loading) return <Loading />;
  return (
    <>
      <BreadCrumbs currentPageTitle={token?.tokenSerialNumber} />
      <div className="items-center flex min-w-full justify-between gap-3 flex-wrap">
        <PageHeader
          headerText={formatMessage(
            {
              id: 'token-id',
              defaultMessage: 'Token Serial Number {tokenSerialNumber}',
            },
            { tokenSerialNumber: token?.tokenSerialNumber },
          )}
        >
          {token.status !== 'DECENTRALIZED' &&
            hasRole(IRoleAction.UpdateToken) && (
              <div className="mr-2">
                <ExportToken tokenId={token._id} tokenStatus={token.status} />
              </div>
            )}
        </PageHeader>
        <div className="flex items-center gap-2">
          {!token.isCanceled && hasRole(IRoleAction.UpdateToken) && (
            <HeaderDeleteButton
              onClick={onCancelToken}
              text={formatMessage({
                id: 'cancel-ticket',
                defaultMessage: 'Cancel Ticket',
              })}
            />
          )}
          {!token.invalidatedDate &&
          token.isInvalidateable &&
          !token.isCanceled &&
          hasRole(IRoleAction.UpdateToken) ? (
            <HeaderDeleteButton
              onClick={onInvalidateToken}
              text={formatMessage({
                id: 'invalidate-token',
                defaultMessage: 'Invalidate',
              })}
            />
          ) : null}
        </div>
      </div>
      <TokenDetail token={token} />
    </>
  );
};

export default TokenDetailPage;
