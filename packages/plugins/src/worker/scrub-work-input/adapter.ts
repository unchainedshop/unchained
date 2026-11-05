import { type IWorkerAdapter, WorkerAdapter, WorkerDirector, schedule } from '@unchainedshop/core';

const ONE_DAY_IN_SECONDS = 86400;

const everyHour = '0 * * * *';

// Mails hold addresses, texts and links (with their tokens), messages the template payload
export const defaultScrubbedWorkTypes = ['EMAIL', 'MESSAGE'];

// The template name tells which message was sent, and the Admin UI lists messages by it
const defaultKeptInputKeys = ['template'];

export interface ScrubWorkInputOptions {
  /** Work types whose input is scrubbed, default `defaultScrubbedWorkTypes` (EMAIL and MESSAGE) */
  types?: string[];
  /** Seconds after the work finished or was deleted, default one day */
  maxAgeInSeconds?: number;
  /** Input keys that are kept, default `['template']` */
  keep?: string[];
  /** Cron expression (5 fields, server time) of the runs, default every hour */
  schedule?: string;
}

export const ScrubWorkInputWorker: IWorkerAdapter<
  Omit<ScrubWorkInputOptions, 'schedule'>,
  { scrubbedCount: number }
> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker-plugin.scrub-work-input',
  label: 'Scrub the input of finished work',
  version: '1.0.0',
  type: 'SCRUB_WORK_INPUT',

  doWork: async (input, unchainedAPI) => {
    // Autoscheduling without options enqueues the work without input
    const types = input?.types ?? defaultScrubbedWorkTypes;
    const keep = input?.keep ?? defaultKeptInputKeys;
    const maxAgeInSeconds = input?.maxAgeInSeconds ?? ONE_DAY_IN_SECONDS;

    if (
      !Array.isArray(types) ||
      !Array.isArray(keep) ||
      !Number.isFinite(maxAgeInSeconds) ||
      maxAgeInSeconds < 0
    ) {
      return {
        success: false,
        error: {
          name: 'INVALID_INPUT',
          message: 'types and keep must be lists, maxAgeInSeconds a number of seconds',
        },
      };
    }

    try {
      const scrubbedCount = await unchainedAPI.modules.worker.scrubWorkInput({
        types,
        keep,
        before: new Date(Date.now() - maxAgeInSeconds * 1000),
      });
      return { success: true, result: { scrubbedCount } };
    } catch (err) {
      return {
        success: false,
        error: {
          name: err.name,
          message: err.message,
          stack: err.stack,
        },
      };
    }
  },
};

export default ScrubWorkInputWorker;

export const configureScrubWorkInputAutoscheduling = ({
  schedule: cron = everyHour,
  ...input
}: ScrubWorkInputOptions = {}) => {
  WorkerDirector.configureAutoscheduling({
    type: ScrubWorkInputWorker.type,
    schedule: schedule.parse.cron(cron),
    retries: 0,
    input: async () => input,
  });
};
