import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import { useModal, DangerMessage } from '@unchainedshop/admin-ui/modal';
import { Badge, BreadCrumbs, Button, PageHeader, SearchField, Tab } from '@unchainedshop/admin-ui/ui';
import { EmptyNotice } from './Notice.tsx';
import EventTokenList from './EventTokenList.tsx';
import TicketEventEditor from './TicketEventEditor.tsx';
import { useVerdictText } from './TicketCheckCard.tsx';
import useCancelTicket from '../hooks/useCancelTicket.ts';
import useCancelEvent from '../hooks/useCancelEvent.ts';
import useScanTicket from '../hooks/useScanTicket.ts';
import { useAuth } from '@unchainedshop/admin-ui/hooks';
import { buildAttendeeCsv, matchesTicketFilter } from '../utils/attendees.ts';
import { downloadCsv, toFileName } from '../utils/download.ts';
import { describeScanError } from '../utils/scan.ts';
import { useFormatDateTime, generateUniqueId } from '../utils/misc.ts';

// Big events stay responsive; the filter finds the other tickets and the CSV export holds all.
const MAX_ROWS = 200;

const units = (tokens) => tokens.reduce((sum, token) => sum + (token.quantity || 1), 0);

// The tabs of a date: its attendees (search, CSV, cancel, redeem) and its event details and sale rules.
const DateTab = ({
  selectedView = 'attendees',
  product,
  production,
  canEdit,
  canCancel,
  canRedeem,
  tokens,
  shownTokens,
  filter,
  setFilter,
  onExport,
  onCancelTicket,
  onRedeemTicket,
}: Record<string, any>) => {
  const { formatMessage } = useIntl();
  if (selectedView === 'event' && canEdit) {
    return <TicketEventEditor product={product} production={production} onDone={null} />;
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <SearchField onInputChange={setFilter} defaultValue={filter} />
        </div>
        <Button
          variant="secondary"
          disabled={!tokens.length}
          onClick={onExport}
          text={formatMessage({ id: 'export_attendees_csv', defaultMessage: 'Export CSV' })}
        />
      </div>
      {tokens.length > 0 && !shownTokens.length ? (
        <EmptyNotice>
          {formatMessage({ id: 'attendee_no_matches', defaultMessage: 'No ticket matches the filter.' })}
        </EmptyNotice>
      ) : (
        <EventTokenList
          tokens={shownTokens.slice(0, MAX_ROWS)}
          onCancelTicket={canCancel ? onCancelTicket : undefined}
          onRedeemTicket={canRedeem ? onRedeemTicket : undefined}
        />
      )}
      {shownTokens.length > MAX_ROWS && (
        <p className="text-sm text-text-muted">
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
  );
};

const TicketEventDetail = ({ product }) => {
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();
  const verdictText = useVerdictText();
  const { setModal } = useModal();
  // The production this date belongs to, if any: it owns the start, category and inherited rules
  const production = product?.proxies?.find((proxy) => proxy?.ticketProduction) ?? null;
  const { cancelTicket } = useCancelTicket();
  const { cancelEvent } = useCancelEvent();
  const { scanTicket } = useScanTicket();
  const { hasRole } = useAuth();
  const canCancel = hasRole('cancelTicket');
  const canRedeem = hasRole('scanTicket');
  const canEdit = hasRole('manageProducts');
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

  const isCanceled = product.event?.isCanceled;
  const status = isCanceled ? 'CANCELLED' : product.status;
  const statusColor = isCanceled ? 'rose' : product.status === 'ACTIVE' ? 'emerald' : 'amber';
  const facts = [
    formatDate(product.event?.startsAt),
    product.event?.location,
    product.event?.category,
    product.event?.doorsOpenAt &&
      formatMessage(
        { id: 'event_doors_open_at', defaultMessage: 'Doors {time}' },
        { time: formatTime(product.event.doorsOpenAt) },
      ),
    product.event?.endsAt &&
      formatMessage(
        { id: 'event_ends_at', defaultMessage: 'Ends {time}' },
        { time: formatTime(product.event.endsAt) },
      ),
  ].filter(Boolean);

  const tabItems = [
    {
      id: 'attendees',
      title: formatMessage({ id: 'attendees', defaultMessage: 'Attendees' }),
      length: tokens.length || undefined,
    },
    ...(canEdit
      ? [
          {
            id: 'event',
            title: formatMessage({ id: 'production_event_tab', defaultMessage: 'Event & sale' }),
          },
        ]
      : []),
  ];

  return (
    <div className="mt-5 max-w-full">
      <BreadCrumbs depth={4} currentPageTitle={product.texts?.title} />
      <div className="flex min-w-full flex-wrap items-center justify-between gap-5">
        <PageHeader
          headerText={product.texts?.title || product._id}
          title={`${product.texts?.title || 'Event'} (${product._id})`}
        />
        <div className="flex flex-wrap gap-3">
          <Badge text={status} color={statusColor} square />
          {product.status === 'ACTIVE' && !isCanceled && canCancel && (
            <Button
              variant="danger"
              text={formatMessage({ id: 'cancel_event', defaultMessage: 'Cancel Event' })}
              onClick={onCancelEvent}
            />
          )}
        </div>
      </div>
      <div className="mt-8 flex flex-wrap gap-3 gap-x-10 text-sm text-text-secondary">
        {facts.map((fact) => (
          <span key={fact}>{fact}</span>
        ))}
        <span>
          {formatMessage(
            {
              id: 'event_sold_summary',
              defaultMessage:
                '{sold} sold{supply, select, none {} other { of {supply}}}, {redeemed} redeemed',
            },
            {
              sold: units(activeTokens),
              supply: supply > 0 ? String(supply) : 'none',
              redeemed: units(redeemedTokens),
            },
          )}
        </span>
        {production && (
          <Link
            href={`/ext/ticketing/${generateUniqueId(production)}`}
            className="underline hover:text-text-primary"
          >
            {formatMessage(
              { id: 'performance_of_production', defaultMessage: 'Date of the production {title}' },
              { title: production.texts?.title || production._id },
            )}
          </Link>
        )}
      </div>
      <Tab tabItems={tabItems} defaultTab="attendees">
        <DateTab
          {...{
            product,
            production,
            canEdit,
            canCancel,
            canRedeem,
            tokens,
            shownTokens,
            filter,
            setFilter,
            onExport,
            onCancelTicket,
            onRedeemTicket,
          }}
        />
      </Tab>
    </div>
  );
};

export default TicketEventDetail;
