import { Migrations } from 'meteor/percolate:migrations';
import { createLogger } from 'meteor/unchained:core-logger';

const logger = createLogger('unchained:platform:migrations');

export default async function setupMigrations() {
  Migrations.config({
    log: true,
    logger({ level, message }) {
      return logger.log({
        level,
        message,
      });
    },
    logIfLatest: false,
  });
  Migrations.unlock();
  Migrations.migrateTo('latest');
}
