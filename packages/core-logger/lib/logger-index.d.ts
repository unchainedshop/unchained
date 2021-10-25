import { LogsModule } from 'unchained-core-types/lib/logs';
import { createLogger, format, transports } from './logger/createLogger';
import { LogLevel } from './logger/LogLevel';
declare let log: LogsModule['log'];
declare const configureLogs: ({ db }: {
    db: any;
}) => Promise<LogsModule>;
export { log, configureLogs, createLogger, format, transports, LogLevel };
