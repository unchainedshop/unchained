import type { TimestampFields } from '@unchainedshop/mongodb';

export type Work = {
  _id?: string;
  priority: number;
  retries: number;
  scheduled: Date;
  type: string;
  input: Record<string, any>;
  error?: any;
  finished?: Date;
  originalWorkId?: string;
  result?: any;
  started?: Date;
  success?: boolean;
  timeout?: number;
  worker?: string;
  autoscheduled?: boolean;
  scheduleId?: string;
} & TimestampFields;
