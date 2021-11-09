import runMigrations from './db/schema';
import { registerEvents } from './director';

export * from './director';
export * from './db';

const GLOBAL_EVENTS = ['PAGE_VIEW'];

export default ({ enableEvent = true }: { enableEvent: boolean }): void => {
  runMigrations();
  if (enableEvent) registerEvents(GLOBAL_EVENTS);
};
