import { createLogger } from './createLogger.js';

const logger = createLogger('unchained');

export const log = logger.info;
