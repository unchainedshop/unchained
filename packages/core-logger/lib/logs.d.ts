import { LogsModule } from 'unchained-core-types';
import { createLogger, format, transports } from './logger/createLogger';
import { LogLevel } from './logger/LogLevel';
declare const configureLogs: ({ db }: {
    db: any;
}) => Promise<LogsModule>;
export { configureLogs, createLogger, format, transports, LogLevel };
