import { WorkerAdapter, WorkerDirector, schedule, type IWorkerAdapter } from '@unchainedshop/core';
import { buildTicketSalesReport, type TicketSalesReportTotal } from './sales-report.ts';
import { buildSalesReportCsv } from './sales-report-csv.ts';
import { TicketingMessageTypes } from './templates/index.ts';

export const TICKET_SALES_REPORT_WORK_TYPE = 'TICKET_SALES_REPORT';

export interface TicketSalesReportWorkInput {
  /** Defaults to the start of yesterday (server time) */
  from?: Date | string;
  /** Defaults to the start of today (server time), exclusive */
  to?: Date | string;
  /** E-mail addresses that get the report with its CSV files; without any, nothing is sent */
  recipients?: string[];
  /** Language of the event titles and category names */
  locale?: string;
}

export interface TicketSalesReportMessagePayload {
  from: Date;
  to: Date;
  recipients: string[];
  totals: TicketSalesReportTotal[];
  csv: ReturnType<typeof buildSalesReportCsv>;
}

const yesterday = () => {
  const to = new Date();
  to.setHours(0, 0, 0, 0);
  const from = new Date(to);
  from.setDate(from.getDate() - 1);
  return { from, to };
};

/**
 * Builds the ticket sales report of a period and e-mails it with its CSV files (message template
 * TICKET_SALES_REPORT) to the recipients. Periods without orders send nothing.
 */
export const TicketSalesReportWorker: IWorkerAdapter<TicketSalesReportWorkInput, any> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker.ticket-sales-report',
  label: 'Ticket sales report',
  version: '1.0.0',
  type: TICKET_SALES_REPORT_WORK_TYPE,
  maxParallelAllocations: 1,

  doWork: async ({ from, to, recipients = [], locale } = {}, unchainedAPI) => {
    try {
      const period = from && to ? { from, to } : yesterday();
      const report = await buildTicketSalesReport(unchainedAPI, { ...period, locale });
      const sent = Boolean(recipients.length && report.orders.length);
      if (sent) {
        const payload: TicketSalesReportMessagePayload = {
          from: report.from,
          to: report.to,
          recipients,
          totals: report.totals,
          csv: buildSalesReportCsv(report),
        };
        await unchainedAPI.modules.worker.addWork({
          type: 'MESSAGE',
          retries: 0,
          input: { template: TicketingMessageTypes.TICKET_SALES_REPORT, ...payload },
        });
      }
      return {
        success: true,
        result: { from: report.from, to: report.to, sent, totals: report.totals },
      };
    } catch (err) {
      return { success: false, error: { name: err.name, message: err.message, stack: err.stack } };
    }
  },
};

export interface TicketSalesReportScheduleOptions {
  /** Cron expression (5 fields, server time), e.g. '0 6 * * *' for every day at 6:00 */
  schedule: string;
  /** Who gets the report of the previous day */
  recipients: string[];
  locale?: string;
}

/** Sends the report of the previous day on the given schedule. */
export const configureTicketSalesReportAutoscheduling = ({
  schedule: cron,
  recipients,
  locale,
}: TicketSalesReportScheduleOptions) => {
  WorkerDirector.configureAutoscheduling({
    type: TICKET_SALES_REPORT_WORK_TYPE,
    schedule: schedule.parse.cron(cron),
    retries: 0,
    input: async () => ({ ...yesterday(), recipients, locale }),
  });
};
