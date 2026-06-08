export const CLASS_LABELS: Record<string, string> = {
  ACCOUNT_CHANGE: 'Account Change',
  AUTHENTICATION: 'Authentication',
  API_ACTIVITY: 'API Activity',
};

export const SEVERITY_LABELS: Record<number, string> = {
  0: 'Unknown',
  1: 'Informational',
  2: 'Low',
  3: 'Medium',
  4: 'High',
  5: 'Critical',
  6: 'Fatal',
  99: 'Other',
};

export const STATUS_LABELS: Record<number, string> = {
  0: 'Unknown',
  1: 'Success',
  2: 'Failure',
  99: 'Other',
};

export const CLASS_COLORS: Record<string, string> = {
  AUTHENTICATION:
    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  ACCOUNT_CHANGE:
    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  API_ACTIVITY:
    'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
};
