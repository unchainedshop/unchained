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

const AUTH_ACTIVITIES: Record<number, string> = {
  0: 'Unknown',
  1: 'Logon',
  2: 'Logoff',
  3: 'Authentication Ticket',
  4: 'Service Ticket Request',
  5: 'Service Ticket Renew',
  6: 'Pre-Auth',
  99: 'Other',
};

const ACCOUNT_ACTIVITIES: Record<number, string> = {
  0: 'Unknown',
  1: 'Create',
  2: 'Enable',
  3: 'Password Change',
  4: 'Password Reset',
  5: 'Disable',
  6: 'Delete',
  7: 'Attach Policy',
  8: 'Detach Policy',
  9: 'Lock',
  10: 'MFA Enable',
  11: 'MFA Disable',
  99: 'Other',
};

const API_ACTIVITIES: Record<number, string> = {
  0: 'Unknown',
  1: 'Create',
  2: 'Read',
  3: 'Update',
  4: 'Delete',
  90: 'Checkout',
  91: 'Payment',
  92: 'Refund',
  93: 'Export',
  94: 'Import',
  95: 'Access Denied',
  99: 'Other',
};

const ACTIVITY_MAP: Record<number, Record<number, string>> = {
  3002: AUTH_ACTIVITIES,
  3001: ACCOUNT_ACTIVITIES,
  6003: API_ACTIVITIES,
};

export function getActivityName(classUid: number, activityId: number): string {
  return ACTIVITY_MAP[classUid]?.[activityId] || `Activity ${activityId}`;
}
