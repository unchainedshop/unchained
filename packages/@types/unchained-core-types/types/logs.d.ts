export enum LogLevel {
  Info = 'info' ,
  Debug = 'debug' ,
  Error = 'error' ,
  Warning = 'warning',
}

export interface Log {
  level: LogLevel
  message: string
  meta?: object
}

export declare interface LogsModule {
  findLogs: (params: {
    limit: number;
    offset: number;
    sort?: object;
  }) => Promise<Array<Log>>;

  count: () => Promise<number>;
}
