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
import { getAuditContext } from './request-context.ts';

const logger = createLogger('unchained:audit-integration');

function entityLabel(entity: Record<string, any> | undefined, fallbackId?: string): string {
  if (!entity) return fallbackId || 'unknown';
  const name =
    entity.slugs?.[0] || entity.key || entity.isoCode || entity.title || entity.name || entity.type;
  const id = entity._id || fallbackId;
  if (name && id) return `${name} (${id})`;
  return name || id || 'unknown';
}

function changedFields(payload: Record<string, any>, excludeKeys: string[]): string {
  const keys = Object.keys(payload).filter(
    (k) => !excludeKeys.includes(k) && !k.startsWith('_') && k !== 'updated',
  );
  if (!keys.length) return '';
  return ` [${keys.join(', ')}]`;
}

/** Extracts common audit context from any event payload */
function extractContext(payload: Record<string, any>) {
  const reqCtx = getAuditContext();
  return {
    userId: payload.userId || payload.user?._id || payload.user?.id || reqCtx?.userId,
    userName:
      payload.userName ||
      payload.user?.username ||
      payload.user?.emails?.[0]?.address ||
      reqCtx?.userName,
    remoteAddress: payload.remoteAddress || payload.ip || reqCtx?.remoteAddress,
    sessionId: payload.sessionId || reqCtx?.sessionId,
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

  sub('API_LOGIN_FAILED', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logAuthentication({
      activity: OCSF_AUTH_ACTIVITY.LOGON,
      ...ctx,
      success: false,
      message: 'Failed login attempt',
    });
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
      message: `Order created: ${entityLabel(p.order)}`,
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
      message: `Order checkout: ${entityLabel(p.order)}`,
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
      message: `Order confirmed: ${entityLabel(p.order)}`,
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
      message: `Order fulfilled: ${entityLabel(p.order)}`,
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
      message: `Order rejected: ${entityLabel(p.order)}`,
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

  // Order lifecycle (remaining)
  sub('ORDER_DELIVER', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.UPDATE,
      ...ctx,
      userId: p.order?.userId || ctx.userId,
      success: true,
      operation: 'deliverOrder',
      message: `Order delivered: ${entityLabel(p.order)}`,
    });
  });

  sub('ORDER_REMOVE', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.DELETE,
      ...ctx,
      success: true,
      operation: 'removeOrder',
      message: `Order removed: ${entityLabel(p.order)}`,
    });
  });

  sub('ORDER_EMPTY_CART', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.DELETE,
      ...ctx,
      success: true,
      operation: 'emptyCart',
      message: 'Cart emptied',
    });
  });

  sub('ORDER_SET_PAYMENT_PROVIDER', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.UPDATE,
      ...ctx,
      success: true,
      operation: 'setPaymentProvider',
      message: `Payment provider set: ${p.paymentProviderId || 'unknown'}`,
    });
  });

  sub('ORDER_SET_DELIVERY_PROVIDER', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.UPDATE,
      ...ctx,
      success: true,
      operation: 'setDeliveryProvider',
      message: `Delivery provider set: ${p.deliveryProviderId || 'unknown'}`,
    });
  });

  // Access control
  sub('ACL_DENIED', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.ACCESS_DENIED,
      ...ctx,
      success: false,
      operation: p.action || 'unknown',
      message: `Access denied: ${p.action || 'unknown'}`,
    });
  });

  sub('ACL_GRANTED_SENSITIVE', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.UPDATE,
      ...ctx,
      success: true,
      operation: p.action || 'impersonate',
      message: `Sensitive access granted: ${p.action || 'unknown'}`,
    });
  });

  // Products
  sub('PRODUCT_CREATE', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.CREATE,
      ...ctx,
      success: true,
      operation: 'createProduct',
      message: `Product created: ${entityLabel(p.product)}`,
    });
  });

  sub('PRODUCT_UPDATE', async (p) => {
    const ctx = extractContext(p);
    const fields = changedFields(p, [
      'product',
      'productId',
      'userId',
      'userName',
      'remoteAddress',
      'sessionId',
    ]);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.UPDATE,
      ...ctx,
      success: true,
      operation: 'updateProduct',
      message: `Product updated: ${entityLabel(p.product, p.productId)}${fields}`,
    });
  });

  sub('PRODUCT_REMOVE', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.DELETE,
      ...ctx,
      success: true,
      operation: 'removeProduct',
      message: `Product removed: ${entityLabel(p.product, p.productId)}`,
    });
  });

  sub('PRODUCT_PUBLISH', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.UPDATE,
      ...ctx,
      success: true,
      operation: 'publishProduct',
      message: `Product published: ${entityLabel(p.product, p.productId)}`,
    });
  });

  sub('PRODUCT_UNPUBLISH', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.UPDATE,
      ...ctx,
      success: true,
      operation: 'unpublishProduct',
      message: `Product unpublished: ${entityLabel(p.product, p.productId)}`,
    });
  });

  // Provider configuration
  sub('PAYMENT_PROVIDER_CREATE', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.CREATE,
      ...ctx,
      success: true,
      operation: 'createPaymentProvider',
      message: `Payment provider created: ${entityLabel(p.paymentProvider)}`,
    });
  });

  sub('PAYMENT_PROVIDER_UPDATE', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.UPDATE,
      ...ctx,
      success: true,
      operation: 'updatePaymentProvider',
      message: `Payment provider updated: ${entityLabel(p.paymentProvider, p.paymentProviderId)}`,
    });
  });

  sub('PAYMENT_PROVIDER_REMOVE', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.DELETE,
      ...ctx,
      success: true,
      operation: 'removePaymentProvider',
      message: `Payment provider removed: ${entityLabel(p.paymentProvider, p.paymentProviderId)}`,
    });
  });

  sub('DELIVERY_PROVIDER_CREATE', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.CREATE,
      ...ctx,
      success: true,
      operation: 'createDeliveryProvider',
      message: `Delivery provider created: ${entityLabel(p.deliveryProvider)}`,
    });
  });

  sub('DELIVERY_PROVIDER_UPDATE', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.UPDATE,
      ...ctx,
      success: true,
      operation: 'updateDeliveryProvider',
      message: `Delivery provider updated: ${entityLabel(p.deliveryProvider, p.deliveryProviderId)}`,
    });
  });

  sub('DELIVERY_PROVIDER_REMOVE', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.DELETE,
      ...ctx,
      success: true,
      operation: 'removeDeliveryProvider',
      message: `Delivery provider removed: ${entityLabel(p.deliveryProvider, p.deliveryProviderId)}`,
    });
  });

  sub('WAREHOUSING_PROVIDER_CREATE', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.CREATE,
      ...ctx,
      success: true,
      operation: 'createWarehousingProvider',
      message: `Warehousing provider created: ${entityLabel(p.warehousingProvider)}`,
    });
  });

  sub('WAREHOUSING_PROVIDER_UPDATE', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.UPDATE,
      ...ctx,
      success: true,
      operation: 'updateWarehousingProvider',
      message: `Warehousing provider updated: ${entityLabel(p.warehousingProvider, p.warehousingProviderId)}`,
    });
  });

  sub('WAREHOUSING_PROVIDER_REMOVE', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.DELETE,
      ...ctx,
      success: true,
      operation: 'removeWarehousingProvider',
      message: `Warehousing provider removed: ${entityLabel(p.warehousingProvider, p.warehousingProviderId)}`,
    });
  });

  // Tokens
  sub('TOKEN_OWNERSHIP_CHANGED', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.UPDATE,
      ...ctx,
      success: true,
      operation: 'transferToken',
      message: `Token ownership changed: ${entityLabel(p.token, p.tokenId)}`,
    });
  });

  sub('TOKEN_INVALIDATED', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.DELETE,
      ...ctx,
      success: true,
      operation: 'invalidateToken',
      message: `Token invalidated: ${entityLabel(p.token, p.tokenId)}`,
    });
  });

  // Enrollments / Subscriptions
  sub('ENROLLMENT_CREATE', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.CREATE,
      ...ctx,
      success: true,
      operation: 'createEnrollment',
      message: `Enrollment created: ${entityLabel(p.enrollment)}`,
    });
  });

  sub('ENROLLMENT_UPDATE', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.UPDATE,
      ...ctx,
      success: true,
      operation: 'updateEnrollment',
      message: `Enrollment updated: ${entityLabel(p.enrollment, p.enrollmentId)}`,
    });
  });

  sub('ENROLLMENT_REMOVE', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.DELETE,
      ...ctx,
      success: true,
      operation: 'removeEnrollment',
      message: `Enrollment removed: ${entityLabel(p.enrollment, p.enrollmentId)}`,
    });
  });

  // Quotations
  sub('QUOTATION_REQUEST_CREATE', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.CREATE,
      ...ctx,
      success: true,
      operation: 'createQuotation',
      message: `Quotation created: ${entityLabel(p.quotation)}`,
    });
  });

  sub('QUOTATION_UPDATE', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.UPDATE,
      ...ctx,
      success: true,
      operation: 'updateQuotation',
      message: `Quotation updated: ${entityLabel(p.quotation, p.quotationId)}`,
    });
  });

  // Assortments / Merchandising
  sub('ASSORTMENT_CREATE', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.CREATE,
      ...ctx,
      success: true,
      operation: 'createAssortment',
      message: `Assortment created: ${entityLabel(p.assortment)}`,
    });
  });

  sub('ASSORTMENT_UPDATE', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.UPDATE,
      ...ctx,
      success: true,
      operation: 'updateAssortment',
      message: `Assortment updated: ${entityLabel(p.assortment, p.assortmentId)}`,
    });
  });

  sub('ASSORTMENT_REMOVE', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.DELETE,
      ...ctx,
      success: true,
      operation: 'removeAssortment',
      message: `Assortment removed: ${entityLabel(p.assortment, p.assortmentId)}`,
    });
  });

  // Filters
  sub('FILTER_CREATE', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.CREATE,
      ...ctx,
      success: true,
      operation: 'createFilter',
      message: `Filter created: ${entityLabel(p.filter)}`,
    });
  });

  sub('FILTER_UPDATE', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.UPDATE,
      ...ctx,
      success: true,
      operation: 'updateFilter',
      message: `Filter updated: ${entityLabel(p.filter, p.filterId)}`,
    });
  });

  sub('FILTER_REMOVE', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.DELETE,
      ...ctx,
      success: true,
      operation: 'removeFilter',
      message: `Filter removed: ${entityLabel(p.filter, p.filterId)}`,
    });
  });

  // Files
  sub('FILE_CREATE', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.CREATE,
      ...ctx,
      success: true,
      operation: 'createFile',
      message: `File created: ${entityLabel(p.file, p.fileId)}`,
    });
  });

  sub('FILE_REMOVE', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.DELETE,
      ...ctx,
      success: true,
      operation: 'removeFile',
      message: `File removed: ${entityLabel(p.file, p.fileId)}`,
    });
  });

  // System configuration
  sub('COUNTRY_CREATE', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.CREATE,
      ...ctx,
      success: true,
      operation: 'createCountry',
      message: `Country created: ${entityLabel(p.country, p.countryId)}`,
    });
  });

  sub('COUNTRY_UPDATE', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.UPDATE,
      ...ctx,
      success: true,
      operation: 'updateCountry',
      message: `Country updated: ${entityLabel(p.country, p.countryId)}`,
    });
  });

  sub('COUNTRY_REMOVE', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.DELETE,
      ...ctx,
      success: true,
      operation: 'removeCountry',
      message: `Country removed: ${entityLabel(p.country, p.countryId)}`,
    });
  });

  sub('CURRENCY_CREATE', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.CREATE,
      ...ctx,
      success: true,
      operation: 'createCurrency',
      message: `Currency created: ${entityLabel(p.currency, p.currencyId)}`,
    });
  });

  sub('CURRENCY_UPDATE', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.UPDATE,
      ...ctx,
      success: true,
      operation: 'updateCurrency',
      message: `Currency updated: ${entityLabel(p.currency, p.currencyId)}`,
    });
  });

  sub('CURRENCY_REMOVE', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.DELETE,
      ...ctx,
      success: true,
      operation: 'removeCurrency',
      message: `Currency removed: ${entityLabel(p.currency, p.currencyId)}`,
    });
  });

  sub('LANGUAGE_CREATE', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.CREATE,
      ...ctx,
      success: true,
      operation: 'createLanguage',
      message: `Language created: ${entityLabel(p.language, p.languageId)}`,
    });
  });

  sub('LANGUAGE_UPDATE', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.UPDATE,
      ...ctx,
      success: true,
      operation: 'updateLanguage',
      message: `Language updated: ${entityLabel(p.language, p.languageId)}`,
    });
  });

  sub('LANGUAGE_REMOVE', async (p) => {
    const ctx = extractContext(p);
    await auditLog.logApiActivity({
      activity: OCSF_API_ACTIVITY.DELETE,
      ...ctx,
      success: true,
      operation: 'removeLanguage',
      message: `Language removed: ${entityLabel(p.language, p.languageId)}`,
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
  'API_LOGIN_FAILED',
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

  // Order lifecycle (extended)
  'ORDER_DELIVER',
  'ORDER_REMOVE',
  'ORDER_EMPTY_CART',
  'ORDER_SET_PAYMENT_PROVIDER',
  'ORDER_SET_DELIVERY_PROVIDER',

  // Access control
  'ACL_DENIED',
  'ACL_GRANTED_SENSITIVE',

  // Products
  'PRODUCT_CREATE',
  'PRODUCT_UPDATE',
  'PRODUCT_REMOVE',
  'PRODUCT_PUBLISH',
  'PRODUCT_UNPUBLISH',

  // Provider configuration
  'PAYMENT_PROVIDER_CREATE',
  'PAYMENT_PROVIDER_UPDATE',
  'PAYMENT_PROVIDER_REMOVE',
  'DELIVERY_PROVIDER_CREATE',
  'DELIVERY_PROVIDER_UPDATE',
  'DELIVERY_PROVIDER_REMOVE',
  'WAREHOUSING_PROVIDER_CREATE',
  'WAREHOUSING_PROVIDER_UPDATE',
  'WAREHOUSING_PROVIDER_REMOVE',

  // Tokens
  'TOKEN_OWNERSHIP_CHANGED',
  'TOKEN_INVALIDATED',

  // Enrollments
  'ENROLLMENT_CREATE',
  'ENROLLMENT_UPDATE',
  'ENROLLMENT_REMOVE',

  // Quotations
  'QUOTATION_REQUEST_CREATE',
  'QUOTATION_UPDATE',

  // Assortments
  'ASSORTMENT_CREATE',
  'ASSORTMENT_UPDATE',
  'ASSORTMENT_REMOVE',

  // Filters
  'FILTER_CREATE',
  'FILTER_UPDATE',
  'FILTER_REMOVE',

  // Files
  'FILE_CREATE',
  'FILE_REMOVE',

  // System configuration
  'COUNTRY_CREATE',
  'COUNTRY_UPDATE',
  'COUNTRY_REMOVE',
  'CURRENCY_CREATE',
  'CURRENCY_UPDATE',
  'CURRENCY_REMOVE',
  'LANGUAGE_CREATE',
  'LANGUAGE_UPDATE',
  'LANGUAGE_REMOVE',
] as const;
