/**
 * Audit Log Integration Layer
 *
 * Connects Unchained's event system to the OCSF audit log for compliance.
 * Subscribes to relevant events and automatically creates audit log entries.
 */

import { createLogger } from '@unchainedshop/logger';
import { EventDirector } from '../EventDirector.ts';
import type { AuditLog } from './index.ts';
import { OCSF_AUTH_ACTIVITY, OCSF_ACCOUNT_ACTIVITY, OCSF_API_ACTIVITY } from './ocsf-types.ts';

const logger = createLogger('unchained:audit-integration');

/** Extracts common audit context from any event payload */
function extractContext(payload: Record<string, any>) {
  return {
    userId: payload.userId || payload.user?._id || payload.user?.id,
    userName: payload.userName || payload.user?.username || payload.user?.emails?.[0]?.address,
    remoteAddress: payload.remoteAddress || payload.ip,
    sessionId: payload.sessionId,
  };
}

type AccountActivity = (typeof OCSF_ACCOUNT_ACTIVITY)[keyof typeof OCSF_ACCOUNT_ACTIVITY];

/** Maps account action types to OCSF activities */
const ACCOUNT_ACTION_MAP: Record<string, { activity: AccountActivity; message: string }> = {
  'reset-password': {
    activity: OCSF_ACCOUNT_ACTIVITY.PASSWORD_RESET,
    message: 'Password reset requested',
  },
  'verify-email': { activity: OCSF_ACCOUNT_ACTIVITY.ENABLE, message: 'Email verified' },
  'enroll-account': { activity: OCSF_ACCOUNT_ACTIVITY.ENABLE, message: 'Account enrolled' },
};

/**
 * Configure automatic audit logging for Unchained events.
 *
 * Subscribes to relevant events and creates OCSF audit log entries.
 * Call once during application startup after creating the audit log.
 */
export function configureAuditIntegration(auditLog: AuditLog): void {
  const sub = (event: string, handler: (payload: Record<string, any>) => Promise<void>) => {
    try {
      EventDirector.subscribe(event, async ({ payload }) => {
        try {
          await handler(payload);
        } catch (error) {
          logger.error(`Audit log error for ${event}: ${error}`);
        }
      });
    } catch {
      // Event not registered - skip
    }
  };

  // Authentication
  sub('API_LOGIN_TOKEN_CREATED', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logAuthentication({ activity: OCSF_AUTH_ACTIVITY.LOGON, ...ctx, success: true });
  });

  sub('API_LOGOUT', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logAuthentication({ activity: OCSF_AUTH_ACTIVITY.LOGOFF, ...ctx, success: true });
  });

  // User Account
  sub('USER_CREATE', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logAccountChange({ activity: OCSF_ACCOUNT_ACTIVITY.CREATE, ...ctx, success: true });
  });

  sub('USER_REMOVE', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logAccountChange({ activity: OCSF_ACCOUNT_ACTIVITY.DELETE, ...ctx, success: true });
  });

  sub('USER_UPDATE_PASSWORD', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logAccountChange({
      activity: OCSF_ACCOUNT_ACTIVITY.PASSWORD_CHANGE,
      ...ctx,
      success: true,
    });
  });

  sub('USER_ADD_ROLES', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logAccountChange({
      activity: OCSF_ACCOUNT_ACTIVITY.ATTACH_POLICY,
      ...ctx,
      success: true,
      message: `Roles added: ${p.roles?.join(', ') || 'unknown'}`,
    });
  });

  sub('USER_UPDATE_ROLE', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logAccountChange({
      activity: OCSF_ACCOUNT_ACTIVITY.ATTACH_POLICY,
      ...ctx,
      success: true,
      message: 'User roles updated',
    });
  });

  sub('USER_ACCOUNT_ACTION', async (p) => {
    const ctx = extractContext(p);
    const mapped = ACCOUNT_ACTION_MAP[p.action] || {
      activity: OCSF_ACCOUNT_ACTIVITY.OTHER,
      message: 'Account action',
    };
    await auditLog.logAccountChange({ ...mapped, ...ctx, success: true });
  });

  // Orders
  sub('ORDER_CREATE', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.CREATE,
      ...ctx,
      userId: p.order?.userId || ctx.userId,
      success: true,
      operation: 'createOrder',
      message: `Order created: ${p.order?._id || 'unknown'}`,
    });
  });

  sub('ORDER_CHECKOUT', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.CHECKOUT,
      ...ctx,
      userId: p.order?.userId || ctx.userId,
      success: true,
      operation: 'checkoutOrder',
      message: `Order checkout: ${p.order?._id || 'unknown'}`,
    });
  });

  sub('ORDER_CONFIRMED', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.UPDATE,
      ...ctx,
      userId: p.order?.userId || ctx.userId,
      success: true,
      operation: 'confirmOrder',
      message: `Order confirmed: ${p.order?._id || 'unknown'}`,
    });
  });

  sub('ORDER_FULFILLED', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.UPDATE,
      ...ctx,
      userId: p.order?.userId || ctx.userId,
      success: true,
      operation: 'fulfillOrder',
      message: `Order fulfilled: ${p.order?._id || 'unknown'}`,
    });
  });

  sub('ORDER_REJECTED', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.UPDATE,
      ...ctx,
      userId: p.order?.userId || ctx.userId,
      success: false,
      operation: 'rejectOrder',
      message: `Order rejected: ${p.order?._id || 'unknown'}`,
    });
  });

  sub('ORDER_ADD_PRODUCT', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.UPDATE,
      ...ctx,
      success: true,
      operation: 'addToCart',
      message: `Product added to cart: ${p.orderPosition?.productId || 'unknown'}`,
    });
  });

  sub('ORDER_REMOVE_CART_ITEM', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.DELETE,
      ...ctx,
      success: true,
      operation: 'removeFromCart',
      message: 'Product removed from cart',
    });
  });

  // Payments
  sub('ORDER_PAY', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.PAYMENT,
      ...ctx,
      success: true,
      operation: 'processPayment',
      message: 'Payment processed for order',
    });
  });

  sub('ORDER_UPDATE_PAYMENT', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.PAYMENT,
      ...ctx,
      success: true,
      operation: 'updatePayment',
      message: 'Payment updated',
    });
  });
}

/**
 * List of events that are tracked for audit compliance.
 * Use this to verify all required events are being captured.
 */
export const AUDITED_EVENTS = [
  // Authentication
  'API_LOGIN_TOKEN_CREATED',
  'API_LOGOUT',

  // User account
  'USER_CREATE',
  'USER_REMOVE',
  'USER_UPDATE_PASSWORD',
  'USER_ADD_ROLES',
  'USER_UPDATE_ROLE',
  'USER_ACCOUNT_ACTION',

  // Orders
  'ORDER_CREATE',
  'ORDER_CHECKOUT',
  'ORDER_CONFIRMED',
  'ORDER_FULFILLED',
  'ORDER_REJECTED',
  'ORDER_ADD_PRODUCT',
  'ORDER_REMOVE_CART_ITEM',

  // Payments
  'ORDER_PAY',
  'ORDER_UPDATE_PAYMENT',
] as const;
