import { createLogger } from './createLogger.js';

const logger = createLogger('unchained');

export const defaultLogger = logger;

export const log = logger.info;
