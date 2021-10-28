import { format, transports } from 'winston';
import TransportStream from 'winston-transport';
export { transports, format };
export declare const createLogger: (moduleName: string, moreTransports?: Array<TransportStream>) => import("winston").Logger;
