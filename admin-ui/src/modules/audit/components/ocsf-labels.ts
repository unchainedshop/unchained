import { useIntl } from 'react-intl';

export const CLASS_COLORS: Record<string, string> = {
  AUTHENTICATION:
    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  ACCOUNT_CHANGE:
    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  API_ACTIVITY:
    'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
};

export function useOcsfLabels() {
  const { formatMessage } = useIntl();

  const CLASS_LABELS: Record<string, string> = {
    ACCOUNT_CHANGE: formatMessage({
      id: 'audit_class_account_change',
      defaultMessage: 'Account Change',
    }),
    AUTHENTICATION: formatMessage({
      id: 'audit_class_authentication',
      defaultMessage: 'Authentication',
    }),
    API_ACTIVITY: formatMessage({
      id: 'audit_class_api_activity',
      defaultMessage: 'API Activity',
    }),
  };

  const SEVERITY_LABELS: Record<number, string> = {
    0: formatMessage({
      id: 'audit_severity_unknown',
      defaultMessage: 'Unknown',
    }),
    1: formatMessage({
      id: 'audit_severity_informational',
      defaultMessage: 'Informational',
    }),
    2: formatMessage({ id: 'audit_severity_low', defaultMessage: 'Low' }),
    3: formatMessage({ id: 'audit_severity_medium', defaultMessage: 'Medium' }),
    4: formatMessage({ id: 'audit_severity_high', defaultMessage: 'High' }),
    5: formatMessage({
      id: 'audit_severity_critical',
      defaultMessage: 'Critical',
    }),
    6: formatMessage({ id: 'audit_severity_fatal', defaultMessage: 'Fatal' }),
    99: formatMessage({ id: 'audit_severity_other', defaultMessage: 'Other' }),
  };

  const STATUS_LABELS: Record<number, string> = {
    0: formatMessage({
      id: 'audit_severity_unknown',
      defaultMessage: 'Unknown',
    }),
    1: formatMessage({ id: 'audit_status_success', defaultMessage: 'Success' }),
    2: formatMessage({ id: 'audit_status_failure', defaultMessage: 'Failure' }),
    99: formatMessage({ id: 'audit_severity_other', defaultMessage: 'Other' }),
  };

  const AUTH_ACTIVITIES: Record<number, string> = {
    0: formatMessage({
      id: 'audit_severity_unknown',
      defaultMessage: 'Unknown',
    }),
    1: formatMessage({ id: 'audit_activity_logon', defaultMessage: 'Logon' }),
    2: formatMessage({ id: 'audit_activity_logoff', defaultMessage: 'Logoff' }),
    3: formatMessage({
      id: 'audit_activity_auth_ticket',
      defaultMessage: 'Authentication Ticket',
    }),
    4: formatMessage({
      id: 'audit_activity_service_ticket_request',
      defaultMessage: 'Service Ticket Request',
    }),
    5: formatMessage({
      id: 'audit_activity_service_ticket_renew',
      defaultMessage: 'Service Ticket Renew',
    }),
    6: formatMessage({
      id: 'audit_activity_pre_auth',
      defaultMessage: 'Pre-Auth',
    }),
    99: formatMessage({ id: 'audit_severity_other', defaultMessage: 'Other' }),
  };

  const ACCOUNT_ACTIVITIES: Record<number, string> = {
    0: formatMessage({
      id: 'audit_severity_unknown',
      defaultMessage: 'Unknown',
    }),
    1: formatMessage({ id: 'audit_activity_create', defaultMessage: 'Create' }),
    2: formatMessage({ id: 'audit_activity_enable', defaultMessage: 'Enable' }),
    3: formatMessage({
      id: 'audit_activity_password_change',
      defaultMessage: 'Password Change',
    }),
    4: formatMessage({
      id: 'audit_activity_password_reset',
      defaultMessage: 'Password Reset',
    }),
    5: formatMessage({
      id: 'audit_activity_disable',
      defaultMessage: 'Disable',
    }),
    6: formatMessage({ id: 'audit_activity_delete', defaultMessage: 'Delete' }),
    7: formatMessage({
      id: 'audit_activity_attach_policy',
      defaultMessage: 'Attach Policy',
    }),
    8: formatMessage({
      id: 'audit_activity_detach_policy',
      defaultMessage: 'Detach Policy',
    }),
    9: formatMessage({ id: 'audit_activity_lock', defaultMessage: 'Lock' }),
    10: formatMessage({
      id: 'audit_activity_mfa_enable',
      defaultMessage: 'MFA Enable',
    }),
    11: formatMessage({
      id: 'audit_activity_mfa_disable',
      defaultMessage: 'MFA Disable',
    }),
    99: formatMessage({ id: 'audit_severity_other', defaultMessage: 'Other' }),
  };

  const API_ACTIVITIES: Record<number, string> = {
    0: formatMessage({
      id: 'audit_severity_unknown',
      defaultMessage: 'Unknown',
    }),
    1: formatMessage({ id: 'audit_activity_create', defaultMessage: 'Create' }),
    2: formatMessage({ id: 'audit_activity_read', defaultMessage: 'Read' }),
    3: formatMessage({ id: 'audit_activity_update', defaultMessage: 'Update' }),
    4: formatMessage({ id: 'audit_activity_delete', defaultMessage: 'Delete' }),
    90: formatMessage({
      id: 'audit_activity_checkout',
      defaultMessage: 'Checkout',
    }),
    91: formatMessage({
      id: 'audit_activity_payment',
      defaultMessage: 'Payment',
    }),
    92: formatMessage({
      id: 'audit_activity_refund',
      defaultMessage: 'Refund',
    }),
    93: formatMessage({
      id: 'audit_activity_export',
      defaultMessage: 'Export',
    }),
    94: formatMessage({
      id: 'audit_activity_import',
      defaultMessage: 'Import',
    }),
    95: formatMessage({
      id: 'audit_activity_access_denied',
      defaultMessage: 'Access Denied',
    }),
    99: formatMessage({ id: 'audit_severity_other', defaultMessage: 'Other' }),
  };

  const ACTIVITY_MAP: Record<number, Record<number, string>> = {
    3002: AUTH_ACTIVITIES,
    3001: ACCOUNT_ACTIVITIES,
    6003: API_ACTIVITIES,
  };

  const getActivityName = (classUid: number, activityId: number): string => {
    return ACTIVITY_MAP[classUid]?.[activityId] || `Activity ${activityId}`;
  };

  return { CLASS_LABELS, SEVERITY_LABELS, STATUS_LABELS, getActivityName };
}
