import winston from 'winston';
import { LogOptions } from 'unchained-core-types/logs';
import { Logger } from './Logger';
export declare const log: (Logs: any, message: string, options: LogOptions) => winston.Logger;
