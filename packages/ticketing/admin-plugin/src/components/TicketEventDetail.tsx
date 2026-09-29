import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import { useModal, DangerMessage } from '@unchainedshop/admin-ui/modal';
import { Badge, ImageWithFallback } from '@unchainedshop/admin-ui/ui';
import EventTokenList from './EventTokenList.tsx';
import TicketEventEditor from './TicketEventEditor.tsx';
import { useVerdictText } from './TicketCheckCard.tsx';
import useCancelTicket from '../hooks/useCancelTicket.ts';
import useCancelEvent from '../hooks/useCancelEvent.ts';
import useScanTicket from '../hooks/useScanTicket.ts';
import useViewerActions from '../hooks/useViewerActions.ts';
import { buildAttendeeCsv, matchesTicketFilter } from '../utils/attendees.ts';
import { downloadCsv, toFileName } from '../utils/download.ts';
import { describeScanError } from '../utils/scan.ts';
import { useFormatDateTime, generateUniqueId, defaultNextImageLoader } from '../utils/misc.ts';

// Big events stay responsive; the filter finds the other tickets and the CSV export holds all.
const MAX_ROWS = 200;

const units = (tokens) => tokens.reduce((sum, token) => sum + (token.quantity || 1), 0);

const Fact = ({ label, children }) => (
  <div>
    <span className="block text-sm font-medium text-text-muted">{label}</span>
    <div className="mt-1 text-text-primary">{children}</div>
  </div>
);

const TicketEventDetail = ({ product }) => {
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();
  const verdictText = useVerdictText();
  const { setModal } = useModal();
  const { cancelTicket } = useCancelTicket();
  const { cancelEvent } = useCancelEvent();
  const { scanTicket } = useScanTicket();
  const { hasAction } = useViewerActions();
  const canCancel = hasAction('cancelTicket');
  const canRedeem = hasAction('scanTicket');
  const canEdit = hasAction('manageProducts');
  const [editing, setEditing] = useState(false);
  const [filter, setFilter] = useState('');

  const tokens = useMemo(() => product?.tokens || [], [product?.tokens]);
  const shownTokens = useMemo(
    () => tokens.filter((token) => matchesTicketFilter(token, filter)),
    [tokens, filter],
  );
  const activeTokens = tokens.filter((t) => t.ticketStatus !== 'CANCELLED');
  const redeemedTokens = activeTokens.filter((t) => t.ticketStatus === 'REDEEMED');
  const supply = product?.contractConfiguration?.supply || 0;

  const formatDate = (date) =>
    date ? formatDateTime(date, { dateStyle: 'full', timeStyle: 'short' }) : '-';
  const formatTime = (date) => (date ? formatDateTime(date, { timeStyle: 'short' }) : '-');

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

  const onRedeemTicket = async (tokenId: string) => {
    try {
      await scanTicket({ tokenId, productId: product._id });
      toast.success(
        formatMessage({
          id: 'ticket_redeemed',
          defaultMessage: 'Ticket redeemed successfully',
        }),
      );
    } catch (error) {
      const { title, detail } = verdictText({ code: tokenId, check: describeScanError(error) }, [
        product._id,
      ]);
      toast.error([title, detail].filter(Boolean).join(': '));
    }
  };

  const onExport = () => {
    const csv = buildAttendeeCsv(tokens, {
      ticketId: formatMessage({ id: 'csv_ticket_id', defaultMessage: 'Ticket ID' }),
      serial: formatMessage({ id: 'csv_serial', defaultMessage: 'Ticket #' }),
      attendee: formatMessage({ id: 'csv_attendee', defaultMessage: 'Attendee' }),
      buyer: formatMessage({ id: 'csv_buyer', defaultMessage: 'Buyer' }),
      status: formatMessage({ id: 'csv_status', defaultMessage: 'Status' }),
      redeemedAt: formatMessage({ id: 'csv_redeemed_at', defaultMessage: 'Redeemed at' }),
      cancelledAt: formatMessage({ id: 'csv_cancelled_at', defaultMessage: 'Cancelled at' }),
      guest: formatMessage({ id: 'ticket_guest_buyer', defaultMessage: 'Guest' }),
    });
    downloadCsv(
      `${toFileName(product?.texts?.slug || product?.texts?.title || product._id)}-attendees.csv`,
      csv,
    );
  };

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

            {editing ? (
              <div className="mt-6">
                <TicketEventEditor product={product} onDone={() => setEditing(false)} />
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-2 gap-4">
                <Fact label={formatMessage({ id: 'event_date', defaultMessage: 'Event Date' })}>
                  {formatDate(product.eventStartsAt)}
                </Fact>
                <Fact label={formatMessage({ id: 'event_location', defaultMessage: 'Location' })}>
                  {product.eventLocation || '-'}
                </Fact>
                <Fact label={formatMessage({ id: 'event_doors_open', defaultMessage: 'Doors open' })}>
                  {formatTime(product.eventDoorsOpenAt)}
                </Fact>
                <Fact label={formatMessage({ id: 'event_ends', defaultMessage: 'Ends' })}>
                  {formatTime(product.eventEndsAt)}
                </Fact>
                <Fact label={formatMessage({ id: 'event_category', defaultMessage: 'Category' })}>
                  {product.eventCategory || '-'}
                </Fact>
                <Fact label={formatMessage({ id: 'status', defaultMessage: 'Status' })}>
                  <Badge
                    text={
                      product?.isCanceled
                        ? formatMessage({ id: 'event_status_cancelled', defaultMessage: 'CANCELLED' })
                        : product?.status
                    }
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
                </Fact>
                <Fact label={formatMessage({ id: 'tickets_sold', defaultMessage: 'Tickets Sold' })}>
                  <span className="text-lg font-semibold">{units(activeTokens)}</span>
                  {supply > 0 && <span className="text-text-muted"> / {supply}</span>}
                </Fact>
                <Fact
                  label={formatMessage({ id: 'tickets_redeemed', defaultMessage: 'Tickets Redeemed' })}
                >
                  <span className="text-lg font-semibold">{units(redeemedTokens)}</span>
                  <span className="text-text-muted"> / {units(activeTokens)}</span>
                </Fact>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {canEdit && !editing && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center rounded-md border border-border-default px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-raised"
                >
                  {formatMessage({ id: 'edit_event_details', defaultMessage: 'Edit event details' })}
                </button>
              )}
              {product.status === 'ACTIVE' && !product.isCanceled && canCancel && (
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
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-lg shadow-md p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-text-primary">
            {formatMessage(
              {
                id: 'attendee_list',
                defaultMessage: 'Attendees ({count})',
              },
              { count: tokens.length },
            )}
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder={formatMessage({
                id: 'attendee_filter_placeholder',
                defaultMessage: 'Filter by #serial, attendee or buyer',
              })}
              aria-label={formatMessage({
                id: 'attendee_filter_label',
                defaultMessage: 'Filter tickets',
              })}
              className="block w-64 rounded-md border border-border-default bg-surface-input px-3 py-2 text-sm text-text-primary placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-focus-ring"
            />
            <button
              type="button"
              disabled={!tokens.length}
              onClick={onExport}
              className="inline-flex items-center rounded-md border border-border-default px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-raised disabled:opacity-50"
            >
              {formatMessage({ id: 'export_attendees_csv', defaultMessage: 'Export CSV' })}
            </button>
          </div>
        </div>
        {tokens.length > 0 && !shownTokens.length ? (
          <p className="py-4 text-sm text-text-muted">
            {formatMessage({
              id: 'attendee_no_matches',
              defaultMessage: 'No ticket matches the filter.',
            })}
          </p>
        ) : (
          <EventTokenList
            tokens={shownTokens.slice(0, MAX_ROWS)}
            onCancelTicket={canCancel ? onCancelTicket : undefined}
            onRedeemTicket={canRedeem ? onRedeemTicket : undefined}
          />
        )}
        {shownTokens.length > MAX_ROWS && (
          <p className="pt-4 text-sm text-text-muted">
            {formatMessage(
              {
                id: 'attendee_more_rows',
                defaultMessage:
                  'Showing {shown} of {count} tickets. Filter to find the others; the CSV export contains all of them.',
              },
              { shown: MAX_ROWS, count: shownTokens.length },
            )}
          </p>
        )}
      </div>
    </div>
  );
};

export default TicketEventDetail;
