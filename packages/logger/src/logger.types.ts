export const LogLevel = {
  Verbose: 'verbose',
  Info: 'info',
  Debug: 'debug',
  Error: 'error',
  Warning: 'warn',
} as const;

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];
