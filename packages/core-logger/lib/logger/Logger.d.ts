import { Logger as WinstonLogger } from 'winston';
interface Instance {
    winston: WinstonLogger | null;
}
export declare class Logger implements Instance {
    winston: WinstonLogger;
    constructor(Logs: any);
}
export {};
