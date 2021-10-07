import { LogsModule } from 'unchained-core-types';
import { createLogger, format, transports } from './logger/createLogger';
declare const configureLogs: ({ db }: {
    db: any;
}) => Promise<LogsModule>;
export { configureLogs, createLogger, format, transports };
