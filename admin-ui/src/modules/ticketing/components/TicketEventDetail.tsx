import Link from 'next/link';
import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import useModal from '../../modal/hooks/useModal';
import DangerMessage from '../../modal/components/DangerMessage';
import useFormatDateTime from '../../common/utils/useFormatDateTime';
import ImageWithFallback from '../../common/components/ImageWithFallback';
import defaultNextImageLoader from '../../common/utils/defaultNextImageLoader';
import Badge from '../../common/components/Badge';
import EventTokenList from './EventTokenList';
import useCancelTicket from '../hooks/useCancelTicket';
import useCancelEvent from '../hooks/useCancelEvent';
import useInvalidateTicket from '../../token/hooks/useInvalidateTicket';
import generateUniqueId from '../../common/utils/getUniqueId';

const TicketEventDetail = ({ product }) => {
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();
  const { setModal } = useModal();
  const { cancelTicket } = useCancelTicket();
  const { cancelEvent } = useCancelEvent();
  const { invalidateTicket } = useInvalidateTicket();

  const slot = product?.contractConfiguration?.ercMetadataProperties?.slot;
  const supply = product?.contractConfiguration?.supply || 0;
  const remaining =
    product?.simulatedStocks?.reduce((acc, cur) => acc + cur.quantity, 0) || 0;
  const sold = supply - remaining;

  const activeTokens = product?.tokens?.filter((t) => !t.isCanceled) || [];
  const redeemedTokens = activeTokens.filter((t) => t.invalidatedDate);

  const onCancelEvent = useCallback(async () => {
    await setModal(
      <DangerMessage
        onCancelClick={() => setModal('')}
        message={formatMessage({
          id: 'cancel_event_confirmation',
          defaultMessage:
            'Are you sure you want to cancel this event? All tickets will be cancelled.',
        })}
        onOkClick={async () => {
          setModal('');
          try {
            await cancelEvent({ productId: product._id });
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
    await setModal(
      <DangerMessage
        onCancelClick={() => setModal('')}
        message={formatMessage({
          id: 'cancel_ticket_confirmation',
          defaultMessage: 'Are you sure you want to cancel this ticket?',
        })}
        onOkClick={async () => {
          setModal('');
          try {
            await cancelTicket({ tokenId });
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
    } catch (e) {
      toast.error(
        formatMessage({
          id: 'ticket_redeem_error',
          defaultMessage:
            'Ticket already redeemed or not redeemable at this time',
        }),
      );
    }
  }, []);

  if (!product) return null;

  return (
    <div className="grid gap-6">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Link
              href={`/products?slug=${generateUniqueId(product)}`}
              className="block overflow-hidden rounded-lg bg-slate-50 dark:bg-slate-700 hover:opacity-90"
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
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {product?.texts?.title}
            </h2>
            {product?.texts?.subtitle && (
              <p className="mt-1 text-lg text-slate-600 dark:text-slate-400">
                {product.texts.subtitle}
              </p>
            )}
            {product?.texts?.description && (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                {product.texts.description}
              </p>
            )}

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <span className="block text-sm font-medium text-slate-500 dark:text-slate-400">
                  {formatMessage({
                    id: 'event_date',
                    defaultMessage: 'Event Date',
                  })}
                </span>
                <p className="mt-1 text-slate-900 dark:text-slate-100">
                  {slot
                    ? formatDateTime(slot, {
                        dateStyle: 'full',
                        timeStyle: 'short',
                      })
                    : '-'}
                </p>
              </div>
              <div>
                <span className="block text-sm font-medium text-slate-500 dark:text-slate-400">
                  {formatMessage({
                    id: 'status',
                    defaultMessage: 'Status',
                  })}
                </span>
                <div className="mt-1">
                  <Badge
                    text={product?.status}
                    color={
                      product?.status === 'ACTIVE'
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
                <span className="block text-sm font-medium text-slate-500 dark:text-slate-400">
                  {formatMessage({
                    id: 'tickets_sold',
                    defaultMessage: 'Tickets Sold',
                  })}
                </span>
                <p className="mt-1 text-slate-900 dark:text-slate-100">
                  <span className="text-lg font-semibold">{sold}</span>
                  <span className="text-slate-400"> / {supply}</span>
                </p>
              </div>
              <div>
                <span className="block text-sm font-medium text-slate-500 dark:text-slate-400">
                  {formatMessage({
                    id: 'tickets_redeemed',
                    defaultMessage: 'Tickets Redeemed',
                  })}
                </span>
                <p className="mt-1 text-slate-900 dark:text-slate-100">
                  <span className="text-lg font-semibold">
                    {redeemedTokens.length}
                  </span>
                  <span className="text-slate-400">
                    {' '}
                    / {activeTokens.length}
                  </span>
                </p>
              </div>
            </div>

            {product.status === 'ACTIVE' && (
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

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
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
          onCancelTicket={onCancelTicket}
          onInvalidateTicket={onInvalidateTicket}
        />
      </div>
    </div>
  );
};

export default TicketEventDetail;
