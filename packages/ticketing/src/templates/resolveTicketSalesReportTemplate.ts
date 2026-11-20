import type { TemplateResolver, UnchainedCore } from '@unchainedshop/core';
import { formatPrice, getPriceDecimals } from '@unchainedshop/utils';
import type { TicketSalesReportMessagePayload } from '../sales-report-worker.ts';
import { buildSalesReportCsv, currencyDigits } from '../sales-report-csv.ts';

const csvAttachment = (filename: string, csv: string) => ({
  filename,
  // The byte order mark makes spreadsheets read the file as UTF-8
  content: Buffer.from(`\uFEFF${csv}`, 'utf8').toString('base64'),
  contentType: 'text/csv; charset=utf-8',
  encoding: 'base64',
});

async function prepareReport(report: TicketSalesReportMessagePayload, { modules }: UnchainedCore) {
  if ('csv' in report) return report; // Already queued with formatted attachments.
  const isoCodes = report.totals.map(({ currencyCode }) => currencyCode);
  const currencies = await modules.currencies.findCurrencies({ isoCodes, includeInactive: true });
  const configured = new Map(
    currencies.map(({ isoCode, decimals }) => [isoCode, getPriceDecimals(decimals)]),
  );
  const currencyDecimals = Object.fromEntries(
    isoCodes.map((code) => [code, configured.get(code) ?? currencyDigits(code)]),
  );
  return { csv: buildSalesReportCsv(report, currencyDecimals), currencyDecimals };
}

export const resolveTicketSalesReportTemplate: TemplateResolver<
  TicketSalesReportMessagePayload
> = async (report, api) => {
  const { EMAIL_FROM, EMAIL_WEBSITE_NAME = 'Unchained Shop' } = process.env;
  const { from, to, recipients, totals, locale = 'en' } = report;
  if (!recipients?.length) return [];

  const { csv, currencyDecimals } = await prepareReport(report, api);
  const period = `${new Date(from).toISOString()} – ${new Date(to).toISOString()}`;
  const day = new Date(from).toISOString().slice(0, 10);
  const lines = totals.map(({ currencyCode, orders, tickets, total }) => {
    const decimals = currencyDecimals?.[currencyCode] ?? currencyDigits(currencyCode);
    const price = formatPrice({ amount: total, currencyCode, decimals, locale });
    return `${currencyCode}: ${orders} orders, ${tickets} tickets, ${price}`;
  });

  return [
    {
      type: 'EMAIL',
      input: {
        from: `${EMAIL_WEBSITE_NAME} <${EMAIL_FROM || 'noreply@unchained.local'}>`,
        to: recipients.join(', '),
        subject: `${EMAIL_WEBSITE_NAME}: ticket sales ${day}`,
        text: `Ticket sales ${period}

${lines.join('\n')}

The orders, performances and payment providers are attached as CSV files.
`,
        attachments: [
          csvAttachment(`ticket-sales-orders-${day}.csv`, csv.orders),
          csvAttachment(`ticket-sales-performances-${day}.csv`, csv.performances),
          csvAttachment(`ticket-sales-payment-providers-${day}.csv`, csv.paymentProviders),
        ],
      },
    },
  ];
};
