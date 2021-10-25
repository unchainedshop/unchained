import { LogsModule } from 'unchained-core-types/lib/logs';
import { createLogger, format, transports } from './logger/createLogger';
import { LogLevel } from './logger/LogLevel';
import { configureLogsModule } from './module/configureLogsModule';

let log: LogsModule['log'] = (message) => console.log(message);

const configureLogs = async ({ db }: { db: any }): Promise<LogsModule> => {
  const module = await configureLogsModule({ db });

  log = module.log;

  return module;
};

export { log, configureLogs, createLogger, format, transports, LogLevel };
