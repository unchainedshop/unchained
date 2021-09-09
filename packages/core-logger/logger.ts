import { LogsModule } from 'unchained-core-types';
import { LogsCollection } from './db/LogsCollection';
import { createLogger, format, transports } from './logger/createLogger';
import { configureLogsModule } from './module/configureLogsModule';

const configureLogs = ({ db }: { db: any }): LogsModule => {
  const collection = LogsCollection(db);
  const module = configureLogsModule(collection);

  return module;
};

export { configureLogs, createLogger, format, transports };
