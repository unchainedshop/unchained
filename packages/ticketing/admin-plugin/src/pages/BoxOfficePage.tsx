import { useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import {
  BreadCrumbs,
  Badge,
  Button,
  Loading,
  NoData,
  PageHeader,
  Table,
} from '@unchainedshop/admin-ui/ui';
import { useBoxOfficeEvents, useBoxOfficeSale } from '../hooks/useBoxOffice.ts';
import useScanTicket from '../hooks/useScanTicket.ts';
import { groupPerformances, saleErrorCode } from '../utils/box-office.ts';
import { useFormatDateTime, useFormatPrice } from '../utils/misc.ts';
import { AlertNotice } from '../components/Notice.tsx';
import { errorMessage } from '../components/production/fields.tsx';

const inputClassName =
  'block w-full rounded-md border-1 border-border-default px-3 py-2 text-sm text-text-primary shadow-xs placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-focus-ring dark:bg-slate-900';

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString();
};

const remainingTickets = (event) => {
  const stocks = event.simulatedStocks || [];
  return stocks.length ? stocks.reduce((sum, { quantity }) => sum + (quantity || 0), 0) : null;
};

const maxQuantity = (event) =>
  Math.max(
    0,
    Math.min(remainingTickets(event) ?? Infinity, event.event?.saleRules?.maxPerOrder ?? Infinity, 100),
  );

const BoxOfficePage = () => {
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();
  const { formatPrice } = useFormatPrice();
  const [slotFrom] = useState(startOfToday);
  const { events, loading, error: loadError, refetch } = useBoxOfficeEvents({ slotFrom });
  const { sell } = useBoxOfficeSale();
  const { scanTicket } = useScanTicket();

  const [performanceId, setPerformanceId] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [attendees, setAttendees] = useState<Record<string, string[]>>({});
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [telNumber, setTelNumber] = useState('');
  const [selling, setSelling] = useState(false);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [order, setOrder] = useState<any>(null);
  const [admitted, setAdmitted] = useState<Record<string, string>>({});

  const saleMessages: Record<string, string> = {
    TicketSoldOutError: formatMessage({
      id: 'box_office_sold_out',
      defaultMessage: 'Not enough tickets left for this performance.',
    }),
    TicketSaleNotStartedError: formatMessage({
      id: 'box_office_sale_not_started',
      defaultMessage: 'The sale of this performance has not started yet.',
    }),
    TicketSaleEndedError: formatMessage({
      id: 'box_office_sale_ended',
      defaultMessage: 'The sale of this performance has ended.',
    }),
    TicketNotOnSaleError: formatMessage({
      id: 'box_office_not_on_sale',
      defaultMessage: 'This performance is not on sale.',
    }),
    TicketOrderLimitExceededError: formatMessage({
      id: 'box_office_order_limit',
      defaultMessage: 'More tickets than allowed per order.',
    }),
    TicketEventCancelledError: formatMessage({
      id: 'box_office_event_cancelled',
      defaultMessage: 'This performance is cancelled.',
    }),
    NO_BOX_OFFICE_PROVIDER: formatMessage({
      id: 'box_office_no_provider',
      defaultMessage:
        'There is no active box office payment provider (adapter shop.unchained.payment.box-office).',
    }),
  };

  const performances = useMemo(
    () => groupPerformances(events.filter((event) => !event.event?.isCanceled)),
    [events],
  );
  const performance = performances.find((group) => group[0]._id === performanceId) || null;

  const reset = (nextPerformanceId: string | null = null) => {
    setPerformanceId(nextPerformanceId);
    setQuantities({});
    setAttendees({});
    setFirstName('');
    setLastName('');
    setEmailAddress('');
    setTelNumber('');
    setSaleError(null);
    setOrder(null);
    setAdmitted({});
  };

  const setQuantity = (event, value: string) => {
    const quantity = Math.max(0, Math.min(maxQuantity(event), parseInt(value, 10) || 0));
    setQuantities((current) => ({ ...current, [event._id]: quantity }));
  };

  const setAttendee = (productId: string, index: number, name: string) =>
    setAttendees((current) => {
      const names = [...(current[productId] || [])];
      names[index] = name;
      return { ...current, [productId]: names };
    });

  const total = (performance || []).reduce(
    (sum, event) => sum + (event.simulatedPrice?.amount || 0) * (quantities[event._id] || 0),
    0,
  );
  const currencyCode = performance?.find((event) => event.simulatedPrice)?.simulatedPrice?.currencyCode;
  const ticketCount = Object.values(quantities).reduce((sum, quantity) => sum + quantity, 0);

  const onSell = async () => {
    setSelling(true);
    setSaleError(null);
    try {
      const sold = await sell({
        quantities,
        attendees,
        contact: { emailAddress: emailAddress.trim(), telNumber: telNumber.trim() },
        buyer: { firstName: firstName.trim(), lastName: lastName.trim() },
      });
      setOrder(sold);
      refetch();
    } catch (e) {
      const code = saleErrorCode(e) || e?.message;
      setSaleError(saleMessages[code] || errorMessage(e));
    } finally {
      setSelling(false);
    }
  };

  const onAdmit = async (tokenId: string) => {
    try {
      await scanTicket({ tokenId });
      setAdmitted((current) => ({ ...current, [tokenId]: 'ok' }));
    } catch (e) {
      setAdmitted((current) => ({ ...current, [tokenId]: errorMessage(e) }));
    }
  };

  const dateTime = (value) => formatDateTime(value, { dateStyle: 'medium', timeStyle: 'short' });

  const renderResult = () => (
    <div className="space-y-4 rounded-md bg-surface p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-text-primary">
        {formatMessage(
          { id: 'box_office_sold', defaultMessage: 'Sold: order {orderNumber}' },
          { orderNumber: order.orderNumber || order._id },
        )}
      </h2>
      {order.total && <p className="text-sm text-text-secondary">{formatPrice(order.total)}</p>}
      <Table className="min-w-full">
        <Table.Row header>
          <Table.Cell>{formatMessage({ id: 'gate_ticket_event', defaultMessage: 'Event' })}</Table.Cell>
          <Table.Cell>{formatMessage({ id: 'box_office_ticket', defaultMessage: 'Ticket' })}</Table.Cell>
          <Table.Cell>
            {formatMessage({ id: 'box_office_attendee', defaultMessage: 'Attendee' })}
          </Table.Cell>
          <Table.Cell> </Table.Cell>
        </Table.Row>
        {order.items.flatMap((item) =>
          (item.tokens || []).map((token) => (
            <Table.Row key={token._id}>
              <Table.Cell>
                {item.product?.texts?.title}
                {item.product?.event?.categoryTitle && (
                  <span className="block text-sm text-text-muted">
                    {item.product.event.categoryTitle}
                  </span>
                )}
              </Table.Cell>
              <Table.Cell>#{token.tokenSerialNumber || token._id.slice(-8)}</Table.Cell>
              <Table.Cell>{token.attendeeName || '-'}</Table.Cell>
              <Table.Cell>
                {admitted[token._id] === 'ok' ? (
                  <Badge
                    text={formatMessage({ id: 'box_office_admitted', defaultMessage: 'Admitted' })}
                    color="emerald"
                    square
                  />
                ) : (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      text={formatMessage({ id: 'box_office_admit', defaultMessage: 'Admit now' })}
                      onClick={() => onAdmit(token._id)}
                    />
                    {admitted[token._id] && (
                      <span className="block text-sm text-rose-600">{admitted[token._id]}</span>
                    )}
                  </>
                )}
              </Table.Cell>
            </Table.Row>
          )),
        )}
      </Table>
      <div className="flex flex-wrap gap-3">
        {order.ticketsPdfUrl && (
          <a
            href={order.ticketsPdfUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-md border border-border-default bg-surface px-4 py-2 text-sm font-medium text-text-primary shadow-xs hover:bg-surface-raised"
          >
            {formatMessage({ id: 'box_office_print', defaultMessage: 'Print tickets' })}
          </a>
        )}
        <Button
          text={formatMessage({ id: 'box_office_next_sale', defaultMessage: 'Next sale' })}
          onClick={() => reset(performanceId)}
        />
        <Button
          variant="secondary"
          text={formatMessage({
            id: 'box_office_other_performance',
            defaultMessage: 'Other performance',
          })}
          onClick={() => reset()}
        />
      </div>
    </div>
  );

  const renderSaleForm = () => (
    <div className="space-y-5 rounded-md bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">{performance[0].texts?.title}</h2>
          <p className="text-sm text-text-secondary">
            {[
              performance[0].event?.startsAt && dateTime(performance[0].event.startsAt),
              performance[0].event?.location,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          text={formatMessage({
            id: 'box_office_other_performance',
            defaultMessage: 'Other performance',
          })}
          onClick={() => reset()}
        />
      </div>

      {performance.map((event) => {
        const quantity = quantities[event._id] || 0;
        const remaining = remainingTickets(event);
        return (
          <div key={event._id} className="space-y-2 border-t border-border-subtle pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="font-medium text-text-primary">
                  {event.event?.categoryTitle ||
                    formatMessage({ id: 'box_office_tickets', defaultMessage: 'Tickets' })}
                </span>
                <span className="block text-sm text-text-muted">
                  {[
                    event.simulatedPrice && formatPrice(event.simulatedPrice),
                    remaining !== null &&
                      formatMessage(
                        { id: 'box_office_remaining', defaultMessage: '{count} left' },
                        { count: remaining },
                      ),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </div>
              <input
                type="number"
                min={0}
                max={maxQuantity(event)}
                disabled={maxQuantity(event) === 0}
                aria-label={formatMessage(
                  { id: 'box_office_quantity', defaultMessage: 'Number of {category} tickets' },
                  { category: event.event?.categoryTitle || '' },
                )}
                className={`${inputClassName} w-24`}
                value={quantity || ''}
                placeholder="0"
                onChange={(e) => setQuantity(event, e.target.value)}
              />
            </div>
            {quantity > 0 && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {Array.from({ length: quantity }, (_, index) => (
                  <input
                    key={index}
                    type="text"
                    className={inputClassName}
                    placeholder={formatMessage(
                      {
                        id: 'box_office_attendee_placeholder',
                        defaultMessage: 'Attendee {seat} (optional)',
                      },
                      { seat: index + 1 },
                    )}
                    value={attendees[event._id]?.[index] || ''}
                    onChange={(e) => setAttendee(event._id, index, e.target.value)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className="grid grid-cols-1 gap-3 border-t border-border-subtle pt-4 sm:grid-cols-2">
        <label className="text-sm text-text-secondary">
          {formatMessage({ id: 'box_office_first_name', defaultMessage: 'Buyer first name (optional)' })}
          <input
            type="text"
            className={`${inputClassName} mt-1`}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </label>
        <label className="text-sm text-text-secondary">
          {formatMessage({ id: 'box_office_last_name', defaultMessage: 'Buyer last name (optional)' })}
          <input
            type="text"
            className={`${inputClassName} mt-1`}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </label>
        <label className="text-sm text-text-secondary">
          {formatMessage({ id: 'box_office_email', defaultMessage: 'Buyer e-mail (optional)' })}
          <input
            type="email"
            className={`${inputClassName} mt-1`}
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
          />
        </label>
        <label className="text-sm text-text-secondary">
          {formatMessage({ id: 'box_office_phone', defaultMessage: 'Buyer phone (optional)' })}
          <input
            type="tel"
            className={`${inputClassName} mt-1`}
            value={telNumber}
            onChange={(e) => setTelNumber(e.target.value)}
          />
        </label>
      </div>

      {saleError && <AlertNotice>{saleError}</AlertNotice>}

      <div className="flex flex-wrap items-center justify-end gap-4 border-t border-border-subtle pt-4">
        {ticketCount > 0 && currencyCode && (
          <span className="text-lg font-semibold text-text-primary">
            {formatPrice({ amount: total, currencyCode })}
          </span>
        )}
        <Button
          disabled={selling || ticketCount === 0}
          text={
            selling
              ? formatMessage({ id: 'box_office_selling', defaultMessage: 'Selling…' })
              : formatMessage(
                  {
                    id: 'box_office_sell',
                    defaultMessage: 'Sell {count, plural, one {# ticket} other {# tickets}}, paid',
                  },
                  { count: ticketCount },
                )
          }
          onClick={onSell}
        />
      </div>
    </div>
  );

  const renderPerformances = () => (
    <>
      {loading && !events.length && <Loading />}
      {!loading && !performances.length && (
        <NoData message={formatMessage({ id: 'no_events_noun', defaultMessage: 'events' })} />
      )}
      {performances.length > 0 && (
        <Table className="min-w-full">
          <Table.Row header>
            <Table.Cell>{formatMessage({ id: 'title', defaultMessage: 'Title' })}</Table.Cell>
            <Table.Cell>{formatMessage({ id: 'event_date', defaultMessage: 'Event Date' })}</Table.Cell>
            <Table.Cell>
              {formatMessage({ id: 'box_office_available', defaultMessage: 'Available' })}
            </Table.Cell>
            <Table.Cell> </Table.Cell>
          </Table.Row>
          {performances.map((group) => {
            const [first] = group;
            const remaining = group.map(remainingTickets);
            return (
              <Table.Row key={first._id}>
                <Table.Cell>
                  <span className="font-medium text-text-primary">{first.texts?.title}</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {group
                      .map((event) => event.event?.categoryTitle)
                      .filter(Boolean)
                      .map((title) => (
                        <Badge key={title} text={title} color="slate" square />
                      ))}
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-sm text-text-secondary">
                    {first.event?.startsAt ? dateTime(first.event.startsAt) : '-'}
                  </span>
                  {first.event?.location && (
                    <span className="block text-sm text-text-muted">{first.event.location}</span>
                  )}
                </Table.Cell>
                <Table.Cell>
                  {remaining.every((count) => count === null)
                    ? '-'
                    : remaining.reduce((sum, count) => sum + (count || 0), 0)}
                </Table.Cell>
                <Table.Cell>
                  <Button
                    size="sm"
                    text={formatMessage({
                      id: 'box_office_sell_tickets',
                      defaultMessage: 'Sell tickets',
                    })}
                    onClick={() => reset(first._id)}
                  />
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table>
      )}
    </>
  );

  return (
    <>
      <BreadCrumbs depth={3} />
      <PageHeader
        headerText={formatMessage({ id: 'box_office_header', defaultMessage: 'Box Office' })}
      />
      <div className="mt-5 space-y-4 pb-10">
        <p className="text-sm text-text-muted">
          {formatMessage({
            id: 'box_office_hint',
            defaultMessage:
              'Tickets sold here are paid at the counter. The order is placed on your account; the buyer e-mail receives the order confirmation.',
          })}
        </p>
        {loadError && <AlertNotice>{errorMessage(loadError)}</AlertNotice>}
        {order ? renderResult() : performance ? renderSaleForm() : renderPerformances()}
      </div>
    </>
  );
};

export default BoxOfficePage;
