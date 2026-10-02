import { useIntl } from 'react-intl';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { BreadCrumbs, Button, Loading, NoData, PageHeader, Table } from '@unchainedshop/admin-ui/ui';
import useTicketSalesReport from '../hooks/useTicketSalesReport.ts';
import { buildSalesReportCsv, toDecimalAmount } from '../../../src/sales-report-csv.ts';
import { downloadCsv } from '../utils/download.ts';
import { useFormatDateTime } from '../utils/misc.ts';
import {
  REPORT_PERIODS,
  reportPeriod,
  toDateInputValue,
  type ReportPeriod,
} from '../utils/report-period.ts';
import { AlertNotice } from '../components/Notice.tsx';
import { errorMessage } from '../components/production/fields.tsx';

// Orders are listed up to this number; the CSV always holds all of them.
const ORDER_ROWS = 200;

const formatAmount = (amount: number, currencyCode: string) => {
  const value = toDecimalAmount(amount, currencyCode);
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currencyCode }).format(value);
  } catch {
    return `${value} ${currencyCode}`;
  }
};

const dateInputClassName =
  'rounded-md border-1 border-border-default px-3 py-2 text-sm text-text-primary shadow-xs focus:outline-hidden focus:ring-2 focus:ring-focus-ring dark:bg-slate-900';

const SalesReportPage = () => {
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();
  const { query, replace } = useRouter();

  const period = (
    REPORT_PERIODS.includes(query.period as ReportPeriod) ? query.period : 'thisMonth'
  ) as ReportPeriod;
  const fromDay = (query.from as string) || '';
  const toDay = (query.to as string) || '';
  const range = reportPeriod(period, new Date(), { fromDay, toDay });
  const { report, loading, error } = useTicketSalesReport({ from: range?.from, to: range?.to });

  const setQuery = (next: Record<string, string>) => replace({ query: { ...query, ...next } });
  const choosePeriod = (next: ReportPeriod) => {
    if (next !== 'custom') return setQuery({ period: next });
    // Custom starts with the period shown, so only the day that changes needs to be picked
    const shown = range || reportPeriod('thisMonth');
    const lastDay = new Date(shown.to.getFullYear(), shown.to.getMonth(), shown.to.getDate() - 1);
    return setQuery({
      period: next,
      from: fromDay || toDateInputValue(shown.from),
      to: toDay || toDateInputValue(lastDay),
    });
  };

  const periodLabels: Record<ReportPeriod, string> = {
    today: formatMessage({ id: 'report_period_today', defaultMessage: 'Today' }),
    yesterday: formatMessage({ id: 'report_period_yesterday', defaultMessage: 'Yesterday' }),
    thisMonth: formatMessage({ id: 'report_period_this_month', defaultMessage: 'This month' }),
    lastMonth: formatMessage({ id: 'report_period_last_month', defaultMessage: 'Last month' }),
    thisYear: formatMessage({ id: 'report_period_this_year', defaultMessage: 'This year' }),
    custom: formatMessage({ id: 'report_period_custom', defaultMessage: 'Custom' }),
  };

  const download = (file: 'orders' | 'performances' | 'paymentProviders') => {
    const csv = buildSalesReportCsv(report);
    const suffix = `${toDateInputValue(new Date(report.from))}_${toDateInputValue(
      new Date(new Date(report.to).getTime() - 1),
    )}`;
    const names = {
      orders: 'orders',
      performances: 'performances',
      paymentProviders: 'payment-providers',
    };
    downloadCsv(`ticket-sales-${names[file]}-${suffix}.csv`, csv[file]);
  };

  const dateTime = (value) => formatDateTime(value, { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <>
      <BreadCrumbs depth={3} />
      <PageHeader
        headerText={formatMessage({ id: 'ticket_sales_report', defaultMessage: 'Sales Report' })}
      />
      <div className="mt-5 space-y-6 pb-10">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex flex-wrap rounded-md shadow-xs" role="group">
            {REPORT_PERIODS.map((option, index) => (
              <button
                key={option}
                type="button"
                aria-pressed={period === option}
                onClick={() => choosePeriod(option)}
                className={[
                  'border border-border-default px-4 py-2 text-sm font-medium',
                  index === 0 ? 'rounded-l-md' : '',
                  index === REPORT_PERIODS.length - 1 ? 'rounded-r-md' : '',
                  period === option
                    ? 'bg-slate-800 text-white'
                    : 'bg-surface text-text-secondary hover:bg-surface-raised',
                ].join(' ')}
              >
                {periodLabels[option]}
              </button>
            ))}
          </div>
          {period === 'custom' && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
              <input
                type="date"
                aria-label={formatMessage({ id: 'report_from_day', defaultMessage: 'First day' })}
                className={dateInputClassName}
                value={fromDay}
                onChange={(event) => setQuery({ from: event.target.value })}
              />
              <span>–</span>
              <input
                type="date"
                aria-label={formatMessage({ id: 'report_to_day', defaultMessage: 'Last day' })}
                className={dateInputClassName}
                value={toDay}
                onChange={(event) => setQuery({ to: event.target.value })}
              />
            </div>
          )}
        </div>

        {!range && (
          <AlertNotice tone="warning">
            {formatMessage({
              id: 'report_invalid_period',
              defaultMessage: 'Pick the first and the last day of the period.',
            })}
          </AlertNotice>
        )}
        {error && <AlertNotice>{errorMessage(error)}</AlertNotice>}
        {loading && !report && <Loading />}

        {report && (
          <>
            <p className="text-sm text-text-muted">
              {formatMessage(
                {
                  id: 'report_period_hint',
                  defaultMessage:
                    'Confirmed and fulfilled orders placed from {from} to {to}; amounts include taxes.',
                },
                { from: dateTime(report.from), to: dateTime(report.to) },
              )}
            </p>

            {report.totals.length === 0 ? (
              <NoData message={formatMessage({ id: 'report_no_orders', defaultMessage: 'orders' })} />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {report.totals.map((total) => (
                  <div key={total.currencyCode} className="rounded-md bg-surface p-5 shadow-sm">
                    <div className="text-2xl font-semibold text-text-primary">
                      {formatAmount(total.total, total.currencyCode)}
                    </div>
                    <div className="mt-1 text-sm text-text-secondary">
                      {formatMessage(
                        {
                          id: 'report_total_summary',
                          defaultMessage:
                            '{tickets, plural, one {# ticket} other {# tickets}} in {orders, plural, one {# order} other {# orders}}',
                        },
                        { tickets: total.tickets, orders: total.orders },
                      )}
                    </div>
                    {total.discounts !== 0 && (
                      <div className="text-sm text-text-muted">
                        {formatMessage(
                          { id: 'report_total_discounts', defaultMessage: 'Discounts {amount}' },
                          { amount: formatAmount(total.discounts, total.currencyCode) },
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {report.totals.length > 0 && (
              <>
                <section className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-text-primary">
                      {formatMessage({ id: 'report_performances', defaultMessage: 'Performances' })}
                    </h2>
                    <Button
                      variant="secondary"
                      size="sm"
                      text={formatMessage({ id: 'report_download_csv', defaultMessage: 'Download CSV' })}
                      onClick={() => download('performances')}
                    />
                  </div>
                  <Table className="min-w-full">
                    <Table.Row header>
                      <Table.Cell>{formatMessage({ id: 'title', defaultMessage: 'Title' })}</Table.Cell>
                      <Table.Cell>
                        {formatMessage({ id: 'event_date', defaultMessage: 'Event Date' })}
                      </Table.Cell>
                      <Table.Cell>
                        {formatMessage({ id: 'gate_tickets_header', defaultMessage: 'Tickets' })}
                      </Table.Cell>
                      <Table.Cell>
                        {formatMessage({
                          id: 'report_ticket_revenue',
                          defaultMessage: 'Ticket revenue',
                        })}
                      </Table.Cell>
                    </Table.Row>
                    {report.performances.map((performance) => (
                      <Table.Row key={`${performance.productId}:${performance.currencyCode}`}>
                        <Table.Cell>
                          <span className="font-medium text-text-primary">
                            {performance.title || performance.productId}
                          </span>
                          {performance.categoryTitle && (
                            <span className="block text-sm text-text-muted">
                              {performance.categoryTitle}
                            </span>
                          )}
                        </Table.Cell>
                        <Table.Cell>
                          {performance.startsAt ? dateTime(performance.startsAt) : '-'}
                        </Table.Cell>
                        <Table.Cell>{performance.tickets}</Table.Cell>
                        <Table.Cell>
                          {formatAmount(
                            performance.items + performance.discounts,
                            performance.currencyCode,
                          )}
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table>
                </section>

                <section className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-text-primary">
                      {formatMessage({
                        id: 'report_payment_providers',
                        defaultMessage: 'Payment methods',
                      })}
                    </h2>
                    <Button
                      variant="secondary"
                      size="sm"
                      text={formatMessage({ id: 'report_download_csv', defaultMessage: 'Download CSV' })}
                      onClick={() => download('paymentProviders')}
                    />
                  </div>
                  <Table className="min-w-full">
                    <Table.Row header>
                      <Table.Cell>
                        {formatMessage({
                          id: 'report_payment_provider',
                          defaultMessage: 'Payment provider',
                        })}
                      </Table.Cell>
                      <Table.Cell>
                        {formatMessage({ id: 'report_orders', defaultMessage: 'Orders' })}
                      </Table.Cell>
                      <Table.Cell>
                        {formatMessage({ id: 'gate_tickets_header', defaultMessage: 'Tickets' })}
                      </Table.Cell>
                      <Table.Cell>{formatMessage({ id: 'total', defaultMessage: 'Total' })}</Table.Cell>
                    </Table.Row>
                    {report.paymentProviders.map((provider) => (
                      <Table.Row key={`${provider.paymentProviderId}:${provider.currencyCode}`}>
                        <Table.Cell>
                          <span className="font-medium text-text-primary">
                            {provider.adapterKey || provider.paymentProviderId || '-'}
                          </span>
                        </Table.Cell>
                        <Table.Cell>{provider.orders}</Table.Cell>
                        <Table.Cell>{provider.tickets}</Table.Cell>
                        <Table.Cell>{formatAmount(provider.total, provider.currencyCode)}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table>
                </section>

                <section className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-text-primary">
                      {formatMessage(
                        { id: 'report_orders_count', defaultMessage: 'Orders ({count})' },
                        { count: report.orders.length },
                      )}
                    </h2>
                    <Button
                      variant="secondary"
                      size="sm"
                      text={formatMessage({ id: 'report_download_csv', defaultMessage: 'Download CSV' })}
                      onClick={() => download('orders')}
                    />
                  </div>
                  <Table className="min-w-full">
                    <Table.Row header>
                      <Table.Cell>
                        {formatMessage({ id: 'order_number', defaultMessage: 'Order number' })}
                      </Table.Cell>
                      <Table.Cell>
                        {formatMessage({ id: 'order_date', defaultMessage: 'Order date' })}
                      </Table.Cell>
                      <Table.Cell>
                        {formatMessage({ id: 'report_customer', defaultMessage: 'Customer' })}
                      </Table.Cell>
                      <Table.Cell>
                        {formatMessage({ id: 'gate_tickets_header', defaultMessage: 'Tickets' })}
                      </Table.Cell>
                      <Table.Cell>{formatMessage({ id: 'total', defaultMessage: 'Total' })}</Table.Cell>
                    </Table.Row>
                    {report.orders.slice(0, ORDER_ROWS).map((order) => (
                      <Table.Row key={order.orderId}>
                        <Table.Cell>
                          <Link
                            href={`/orders?orderId=${order.orderId}`}
                            className="font-medium text-text-primary hover:underline"
                          >
                            {order.orderNumber || order.orderId}
                          </Link>
                        </Table.Cell>
                        <Table.Cell>{dateTime(order.ordered)}</Table.Cell>
                        <Table.Cell>
                          {order.billingName || order.emailAddress || '-'}
                          {order.billingName && order.emailAddress && (
                            <span className="block text-sm text-text-muted">{order.emailAddress}</span>
                          )}
                        </Table.Cell>
                        <Table.Cell>{order.tickets}</Table.Cell>
                        <Table.Cell>{formatAmount(order.total, order.currencyCode)}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table>
                  {report.orders.length > ORDER_ROWS && (
                    <p className="text-sm text-text-muted">
                      {formatMessage(
                        {
                          id: 'report_orders_truncated',
                          defaultMessage:
                            'The first {shown} orders are shown; the CSV holds all {count}.',
                        },
                        { shown: ORDER_ROWS, count: report.orders.length },
                      )}
                    </p>
                  )}
                </section>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default SalesReportPage;
