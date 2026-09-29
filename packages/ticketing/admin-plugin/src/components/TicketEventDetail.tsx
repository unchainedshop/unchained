import Link from 'next/link';
import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import { useModal, DangerMessage } from '@unchainedshop/admin-ui/modal';
import { Badge, ImageWithFallback } from '@unchainedshop/admin-ui/ui';
import EventTokenList from './EventTokenList';
import useCancelTicket from '../hooks/useCancelTicket';
import useCancelEvent from '../hooks/useCancelEvent';
import useInvalidateTicket from '../hooks/useInvalidateTicket';
import useViewerActions from '../hooks/useViewerActions';
import { useFormatDateTime, generateUniqueId, defaultNextImageLoader } from '../utils/misc';

const TicketEventDetail = ({ product }) => {
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();
  const { setModal } = useModal();
  const { cancelTicket } = useCancelTicket();
  const { cancelEvent } = useCancelEvent();
  const { invalidateTicket } = useInvalidateTicket();
  const { hasAction } = useViewerActions();
  const canCancel = hasAction('cancelTicket');
  const canRedeem = hasAction('scanTicket');

  const slot = product?.contractConfiguration?.ercMetadataProperties?.slot;
  const supply = product?.contractConfiguration?.supply || 0;
  const remaining = product?.simulatedStocks?.reduce((acc, cur) => acc + cur.quantity, 0) || 0;
  const sold = supply - remaining;

  const activeTokens = product?.tokens?.filter((t) => !t.isCanceled) || [];
  const redeemedTokens = activeTokens.filter((t) => t.invalidatedDate);

  const onCancelEvent = useCallback(async () => {
    let generateDiscount = false;
    await setModal(
      <DangerMessage
        onCancelClick={() => setModal('')}
        message={
          <>
            {formatMessage({
              id: 'cancel_event_confirmation',
              defaultMessage:
                'Are you sure you want to cancel this event? All tickets will be cancelled.',
            })}
            <label className="mt-3 flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                className="rounded border-border-default"
                onChange={(e) => {
                  generateDiscount = e.target.checked;
                }}
              />
              {formatMessage({
                id: 'generate_discount_codes',
                defaultMessage: 'Generate discount codes for affected users',
              })}
            </label>
          </>
        }
        onOkClick={async () => {
          setModal('');
          try {
            await cancelEvent({ productId: product._id, generateDiscount });
            toast.success(
              formatMessage({
                id: 'event_cancelled',
                defaultMessage: 'Event cancelled successfully',
              }),
            );
          } catch (e) {
            toast.error(e.message);
          }
        }}
        okText={formatMessage({
          id: 'cancel_event',
          defaultMessage: 'Cancel Event',
        })}
      />,
    );
  }, [product?._id]);

  const onCancelTicket = useCallback(async (tokenId: string) => {
    let generateDiscount = false;
    await setModal(
      <DangerMessage
        onCancelClick={() => setModal('')}
        message={
          <>
            {formatMessage({
              id: 'cancel_ticket_confirmation',
              defaultMessage: 'Are you sure you want to cancel this ticket?',
            })}
            <label className="mt-3 flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                className="rounded border-border-default"
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
  }, []);

  const onInvalidateTicket = useCallback(async (tokenId: string) => {
    try {
      await invalidateTicket({ tokenId });
      toast.success(
        formatMessage({
          id: 'ticket_redeemed',
          defaultMessage: 'Ticket redeemed successfully',
        }),
      );
    } catch {
      toast.error(
        formatMessage({
          id: 'ticket_redeem_error',
          defaultMessage: 'Ticket already redeemed or not redeemable at this time',
        }),
      );
    }
  }, []);

  if (!product) return null;

  return (
    <div className="grid gap-6">
      <div className="bg-surface rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Link
              href={`/products?slug=${generateUniqueId(product)}`}
              className="block overflow-hidden rounded-lg bg-surface-raised hover:opacity-90"
            >
              <ImageWithFallback
                src={product?.media?.[0]?.file?.url || '/no-image.jpg'}
                loader={defaultNextImageLoader}
                alt={product?.texts?.title || ''}
                width={300}
                height={300}
                layout="responsive"
                className="h-full w-full object-cover"
              />
            </Link>
          </div>
          <div className="md:col-span-2">
            <h2 className="text-2xl font-semibold text-text-primary">{product?.texts?.title}</h2>
            {product?.texts?.subtitle && (
              <p className="mt-1 text-lg text-text-secondary">{product.texts.subtitle}</p>
            )}
            {product?.texts?.description && (
              <p className="mt-3 text-sm text-text-muted">{product.texts.description}</p>
            )}

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <span className="block text-sm font-medium text-text-muted">
                  {formatMessage({
                    id: 'event_date',
                    defaultMessage: 'Event Date',
                  })}
                </span>
                <p className="mt-1 text-text-primary">
                  {slot
                    ? formatDateTime(slot, {
                        dateStyle: 'full',
                        timeStyle: 'short',
                      })
                    : '-'}
                </p>
              </div>
              <div>
                <span className="block text-sm font-medium text-text-muted">
                  {formatMessage({ id: 'status', defaultMessage: 'Status' })}
                </span>
                <div className="mt-1">
                  <Badge
                    text={product?.isCanceled ? 'CANCELLED' : product?.status}
                    color={
                      product?.isCanceled
                        ? 'rose'
                        : product?.status === 'ACTIVE'
                          ? 'emerald'
                          : product?.status === 'DRAFT'
                            ? 'amber'
                            : 'rose'
                    }
                    square
                  />
                </div>
              </div>
              <div>
                <span className="block text-sm font-medium text-text-muted">
                  {formatMessage({
                    id: 'tickets_sold',
                    defaultMessage: 'Tickets Sold',
                  })}
                </span>
                <p className="mt-1 text-text-primary">
                  <span className="text-lg font-semibold">{sold}</span>
                  <span className="text-text-muted"> / {supply}</span>
                </p>
              </div>
              <div>
                <span className="block text-sm font-medium text-text-muted">
                  {formatMessage({
                    id: 'tickets_redeemed',
                    defaultMessage: 'Tickets Redeemed',
                  })}
                </span>
                <p className="mt-1 text-text-primary">
                  <span className="text-lg font-semibold">{redeemedTokens.length}</span>
                  <span className="text-text-muted"> / {activeTokens.length}</span>
                </p>
              </div>
            </div>

            {product.status === 'ACTIVE' && !product.isCanceled && canCancel && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={onCancelEvent}
                  className="inline-flex items-center rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                >
                  {formatMessage({
                    id: 'cancel_event',
                    defaultMessage: 'Cancel Event',
                  })}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          {formatMessage(
            {
              id: 'attendee_list',
              defaultMessage: 'Attendees ({count})',
            },
            { count: product?.tokens?.length || 0 },
          )}
        </h3>
        <EventTokenList
          tokens={product?.tokens}
          onCancelTicket={canCancel ? onCancelTicket : undefined}
          onInvalidateTicket={canRedeem ? onInvalidateTicket : undefined}
        />
      </div>
    </div>
  );
};

export default TicketEventDetail;
