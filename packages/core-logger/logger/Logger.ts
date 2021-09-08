import { LogLevel } from 'unchained-core';
import { Logger as WinstonLogger } from 'winston';
import { createLogger } from './createLogger';
import { LocalTransport } from './LocalTransport';

interface Instance {
  winston: WinstonLogger | null;
}

let instance: Instance | null = null;
export class Logger implements Instance {
  winston: WinstonLogger;

  constructor() {
    if (!instance) {
      instance = this;
    }
    const dbTransport = !process.env.LOG_DISABLE_DB_LOGGER
      ? [new LocalTransport({ level: LogLevel.Info })]
      : [];

    this.winston = createLogger('unchained', dbTransport);

    return this;
  }
}
