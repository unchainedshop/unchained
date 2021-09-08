import { LogsModule } from 'unchained-core';
import { configureLogsCollection } from './db/logs.collection';
import { createLogger, format, transports } from './logger/createLogger';
import { log } from './logger/log';
import { Logger } from './logger/Logger';
import { configureLogsModule } from './module/logs.module';

const configureLogs = async (params: { db: any }): Promise<LogsModule> => {
  const collection = configureLogsCollection(params.db);
  const module = configureLogsModule(collection);

  return module;
};

export { configureLogs, log, Logger, createLogger, format, transports };
