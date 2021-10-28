import { ModuleInput } from 'unchained-core-types/lib/common';
import { LogsModule } from 'unchained-core-types/lib/logs';
import { createLogger, format, transports } from './logger/createLogger';
import { LogLevel } from './logger/LogLevel';
import { configureLogsModule } from './module/configureLogsModule';

let log: LogsModule['log'] = (message) => console.log(message);

// Required to avoid meteor build errors (TypeError: module.runSetters is not a function)
const setLog = (l: LogsModule['log']): void => {
  log = l;
};

const configureLogs = async ({ db }: ModuleInput): Promise<LogsModule> => {
  const module = await configureLogsModule({ db });

  setLog(module.log);

  return module;
};

export { configureLogs, log, createLogger, format, transports, LogLevel };
