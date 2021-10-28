import { ModuleInput } from 'unchained-core-types/lib/common';
import { LogsModule } from 'unchained-core-types/lib/logs';
import { createLogger, format, transports } from './logger/createLogger';
import { LogLevel } from './logger/LogLevel';
declare let log: LogsModule['log'];
declare const configureLogs: ({ db }: ModuleInput) => Promise<LogsModule>;
export { configureLogs, log, createLogger, format, transports, LogLevel };
