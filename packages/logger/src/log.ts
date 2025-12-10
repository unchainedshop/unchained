import { createLogger } from './createLogger.ts';

const logger = createLogger('unchained');

export const defaultLogger = logger;

export const log = logger.info;
