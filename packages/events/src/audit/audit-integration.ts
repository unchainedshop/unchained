/**
 * Audit Integration — bridges unchained events to OCSF audit log entries.
 *
 * Uses a data-driven mapping so new events only require a table entry.
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

function changedFields(
  payload: Record<string, any>,
  excludeKeys: string[],
): { label: string; data: Record<string, any> | null } {
  const keys = Object.keys(payload).filter(
    (k) => !excludeKeys.includes(k) && !k.startsWith('_') && k !== 'updated',
  );
  if (!keys.length) return { label: '', data: null };
  const data: Record<string, any> = {};
  for (const key of keys) {
    data[key] = payload[key];
  }
  return { label: ` [${keys.join(', ')}]`, data };
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

// ---------------------------------------------------------------------------
// Data-driven API activity mappings
// ---------------------------------------------------------------------------

type ApiActivity = (typeof OCSF_API_ACTIVITY)[keyof typeof OCSF_API_ACTIVITY];

interface ApiEventMapping {
  activity: ApiActivity;
  operation: string;
  message: string | ((p: Record<string, any>) => string);
  success?: boolean;
  entityKey?: string;
  entityIdKey?: string;
  useOrderUserId?: boolean;
  trackChangedFields?: boolean;
}

const PAYLOAD_META_KEYS = ['userId', 'userName', 'remoteAddress', 'sessionId'];

const API_EVENT_MAP: Record<string, ApiEventMapping> = {
  // Orders
  ORDER_CREATE: {
    activity: OCSF_API_ACTIVITY.CREATE,
    operation: 'createOrder',
    message: (p) => `Order created: ${entityLabel(p.order)}`,
    useOrderUserId: true,
  },
  ORDER_CHECKOUT: {
    activity: OCSF_API_ACTIVITY.CHECKOUT,
    operation: 'checkoutOrder',
    message: (p) => `Order checkout: ${entityLabel(p.order)}`,
    useOrderUserId: true,
  },
  ORDER_CONFIRMED: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: 'confirmOrder',
    message: (p) => `Order confirmed: ${entityLabel(p.order)}`,
    useOrderUserId: true,
  },
  ORDER_FULFILLED: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: 'fulfillOrder',
    message: (p) => `Order fulfilled: ${entityLabel(p.order)}`,
    useOrderUserId: true,
  },
  ORDER_REJECTED: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: 'rejectOrder',
    message: (p) => `Order rejected: ${entityLabel(p.order)}`,
    success: false,
    useOrderUserId: true,
  },
  ORDER_DELIVER: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: 'deliverOrder',
    message: (p) => `Order delivered: ${entityLabel(p.order)}`,
    useOrderUserId: true,
  },
  ORDER_REMOVE: {
    activity: OCSF_API_ACTIVITY.DELETE,
    operation: 'removeOrder',
    message: (p) => `Order removed: ${entityLabel(p.order)}`,
  },
  ORDER_EMPTY_CART: {
    activity: OCSF_API_ACTIVITY.DELETE,
    operation: 'emptyCart',
    message: 'Cart emptied',
  },
  ORDER_ADD_PRODUCT: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: 'addToCart',
    message: (p) => `Product added to cart: ${p.orderPosition?.productId || 'unknown'}`,
  },
  ORDER_REMOVE_CART_ITEM: {
    activity: OCSF_API_ACTIVITY.DELETE,
    operation: 'removeFromCart',
    message: 'Product removed from cart',
  },
  ORDER_SET_PAYMENT_PROVIDER: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: 'setPaymentProvider',
    message: (p) => `Payment provider set: ${p.paymentProviderId || 'unknown'}`,
  },
  ORDER_SET_DELIVERY_PROVIDER: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: 'setDeliveryProvider',
    message: (p) => `Delivery provider set: ${p.deliveryProviderId || 'unknown'}`,
  },

  // Payments
  ORDER_PAY: {
    activity: OCSF_API_ACTIVITY.PAYMENT,
    operation: 'processPayment',
    message: 'Payment processed for order',
  },
  ORDER_UPDATE_PAYMENT: {
    activity: OCSF_API_ACTIVITY.PAYMENT,
    operation: 'updatePayment',
    message: 'Payment updated',
  },

  // Access control
  ACL_DENIED: {
    activity: OCSF_API_ACTIVITY.ACCESS_DENIED,
    operation: '',
    message: (p) => `Access denied: ${p.action || 'unknown'}`,
    success: false,
  },
  ACL_GRANTED_SENSITIVE: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: '',
    message: (p) => `Sensitive access granted: ${p.action || 'unknown'}`,
  },

  // Products
  PRODUCT_CREATE: {
    activity: OCSF_API_ACTIVITY.CREATE,
    operation: 'createProduct',
    message: (p) => `Product created: ${entityLabel(p.product)}`,
  },
  PRODUCT_UPDATE: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: 'updateProduct',
    entityKey: 'product',
    entityIdKey: 'productId',
    trackChangedFields: true,
    message: '',
  },
  PRODUCT_REMOVE: {
    activity: OCSF_API_ACTIVITY.DELETE,
    operation: 'removeProduct',
    message: (p) => `Product removed: ${entityLabel(p.product, p.productId)}`,
  },
  PRODUCT_PUBLISH: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: 'publishProduct',
    message: (p) => `Product published: ${entityLabel(p.product, p.productId)}`,
  },
  PRODUCT_UNPUBLISH: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: 'unpublishProduct',
    message: (p) => `Product unpublished: ${entityLabel(p.product, p.productId)}`,
  },
  PRODUCT_UPDATE_TEXT: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: 'updateProductText',
    message: (p) =>
      `Product text updated: ${p.productId || 'unknown'} [${p.text?.locale || ''}] ${p.text?.title || ''}`,
  },
  PRODUCT_UPDATE_MEDIA_TEXT: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: 'updateProductMediaText',
    message: (p) => `Product media text updated: ${p.productId || p.mediaId || 'unknown'}`,
  },
  PRODUCT_ADD_MEDIA: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: 'addProductMedia',
    message: (p) => `Product media added: ${p.productId || 'unknown'}`,
  },
  PRODUCT_REMOVE_MEDIA: {
    activity: OCSF_API_ACTIVITY.DELETE,
    operation: 'removeProductMedia',
    message: (p) => `Product media removed: ${p.productId || p.mediaId || 'unknown'}`,
  },
  PRODUCT_REORDER_MEDIA: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: 'reorderProductMedia',
    message: (p) => `Product media reordered: ${p.productId || 'unknown'}`,
  },
  PRODUCT_ADD_ASSIGNMENT: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: 'addProductAssignment',
    message: (p) => `Product assignment added: ${p.productId || 'unknown'}`,
  },
  PRODUCT_REMOVE_ASSIGNMENT: {
    activity: OCSF_API_ACTIVITY.DELETE,
    operation: 'removeProductAssignment',
    message: (p) => `Product assignment removed: ${p.productId || 'unknown'}`,
  },
  PRODUCT_CREATE_BUNDLE_ITEM: {
    activity: OCSF_API_ACTIVITY.CREATE,
    operation: 'createBundleItem',
    message: (p) => `Bundle item created: ${p.productId || 'unknown'}`,
  },
  PRODUCT_REMOVE_BUNDLE_ITEM: {
    activity: OCSF_API_ACTIVITY.DELETE,
    operation: 'removeBundleItem',
    message: (p) => `Bundle item removed: ${p.productId || 'unknown'}`,
  },
  PRODUCT_CREATE_VARIATION: {
    activity: OCSF_API_ACTIVITY.CREATE,
    operation: 'createProductVariation',
    message: (p) => `Product variation created: ${p.productId || 'unknown'}`,
  },
  PRODUCT_REMOVE_VARIATION: {
    activity: OCSF_API_ACTIVITY.DELETE,
    operation: 'removeProductVariation',
    message: (p) => `Product variation removed: ${p.productId || 'unknown'}`,
  },
  PRODUCT_VARIATION_OPTION_CREATE: {
    activity: OCSF_API_ACTIVITY.CREATE,
    operation: 'createVariationOption',
    message: (p) => `Variation option created: ${p.productId || 'unknown'}`,
  },
  PRODUCT_REMOVE_VARIATION_OPTION: {
    activity: OCSF_API_ACTIVITY.DELETE,
    operation: 'removeVariationOption',
    message: (p) => `Variation option removed: ${p.productId || 'unknown'}`,
  },
  PRODUCT_UPDATE_VARIATION_TEXT: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: 'updateVariationText',
    message: (p) => `Variation text updated: ${p.productId || 'unknown'}`,
  },
  PRODUCT_REVIEW_CREATE: {
    activity: OCSF_API_ACTIVITY.CREATE,
    operation: 'createProductReview',
    message: (p) => `Product review created: ${p.productId || 'unknown'}`,
  },
  PRODUCT_UPDATE_REVIEW: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: 'updateProductReview',
    message: (p) => `Product review updated: ${p.productId || 'unknown'}`,
  },
  PRODUCT_REMOVE_REVIEW: {
    activity: OCSF_API_ACTIVITY.DELETE,
    operation: 'removeProductReview',
    message: (p) => `Product review removed: ${p.productId || 'unknown'}`,
  },
  PRODUCT_REVIEW_ADD_VOTE: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: 'addProductReviewVote',
    message: (p) => `Review vote added: ${p.productId || 'unknown'}`,
  },
  PRODUCT_REMOVE_REVIEW_VOTE: {
    activity: OCSF_API_ACTIVITY.DELETE,
    operation: 'removeProductReviewVote',
    message: (p) => `Review vote removed: ${p.productId || 'unknown'}`,
  },

  // Assortment sub-events
  ASSORTMENT_UPDATE_TEXT: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: 'updateAssortmentText',
    message: (p) =>
      `Assortment text updated: ${p.assortmentId || 'unknown'} [${p.text?.locale || ''}] ${p.text?.title || ''}`,
  },
  ASSORTMENT_UPDATE_MEDIA_TEXT: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: 'updateAssortmentMediaText',
    message: (p) => `Assortment media text updated: ${p.assortmentId || 'unknown'}`,
  },
  ASSORTMENT_ADD_PRODUCT: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: 'addAssortmentProduct',
    message: (p) =>
      `Product added to assortment: ${p.productId || 'unknown'} → ${p.assortmentId || 'unknown'}`,
  },
  ASSORTMENT_REMOVE_PRODUCT: {
    activity: OCSF_API_ACTIVITY.DELETE,
    operation: 'removeAssortmentProduct',
    message: (p) => `Product removed from assortment: ${p.assortmentId || 'unknown'}`,
  },
  ASSORTMENT_ADD_LINK: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: 'addAssortmentLink',
    message: (p) => `Assortment link added: ${p.assortmentId || 'unknown'}`,
  },
  ASSORTMENT_REMOVE_LINK: {
    activity: OCSF_API_ACTIVITY.DELETE,
    operation: 'removeAssortmentLink',
    message: (p) => `Assortment link removed: ${p.assortmentId || 'unknown'}`,
  },
  ASSORTMENT_ADD_FILTER: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: 'addAssortmentFilter',
    message: (p) => `Filter added to assortment: ${p.assortmentId || 'unknown'}`,
  },
  ASSORTMENT_REMOVE_FILTER: {
    activity: OCSF_API_ACTIVITY.DELETE,
    operation: 'removeAssortmentFilter',
    message: (p) => `Filter removed from assortment: ${p.assortmentId || 'unknown'}`,
  },
  ASSORTMENT_ADD_MEDIA: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: 'addAssortmentMedia',
    message: (p) => `Assortment media added: ${p.assortmentId || 'unknown'}`,
  },
  ASSORTMENT_REMOVE_MEDIA: {
    activity: OCSF_API_ACTIVITY.DELETE,
    operation: 'removeAssortmentMedia',
    message: (p) => `Assortment media removed: ${p.assortmentId || 'unknown'}`,
  },
  ASSORTMENT_REORDER_PRODUCTS: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: 'reorderAssortmentProducts',
    message: (p) => `Assortment products reordered: ${p.assortmentId || 'unknown'}`,
  },
  ASSORTMENT_REORDER_LINKS: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: 'reorderAssortmentLinks',
    message: (p) => `Assortment links reordered: ${p.assortmentId || 'unknown'}`,
  },
  ASSORTMENT_REORDER_FILTERS: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: 'reorderAssortmentFilters',
    message: (p) => `Assortment filters reordered: ${p.assortmentId || 'unknown'}`,
  },
  ASSORTMENT_REORDER_MEDIA: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: 'reorderAssortmentMedia',
    message: (p) => `Assortment media reordered: ${p.assortmentId || 'unknown'}`,
  },

  // Filter sub-events
  FILTER_UPDATE_TEXT: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: 'updateFilterText',
    message: (p) =>
      `Filter text updated: ${p.filterId || 'unknown'} [${p.text?.locale || ''}] ${p.text?.title || ''}`,
  },

  // Provider configuration
  PAYMENT_PROVIDER_CREATE: {
    activity: OCSF_API_ACTIVITY.CREATE,
    operation: 'createPaymentProvider',
    message: (p) => `Payment provider created: ${entityLabel(p.paymentProvider)}`,
  },
  PAYMENT_PROVIDER_UPDATE: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: 'updatePaymentProvider',
    message: (p) => `Payment provider updated: ${entityLabel(p.paymentProvider, p.paymentProviderId)}`,
  },
  PAYMENT_PROVIDER_REMOVE: {
    activity: OCSF_API_ACTIVITY.DELETE,
    operation: 'removePaymentProvider',
    message: (p) => `Payment provider removed: ${entityLabel(p.paymentProvider, p.paymentProviderId)}`,
  },
  DELIVERY_PROVIDER_CREATE: {
    activity: OCSF_API_ACTIVITY.CREATE,
    operation: 'createDeliveryProvider',
    message: (p) => `Delivery provider created: ${entityLabel(p.deliveryProvider)}`,
  },
  DELIVERY_PROVIDER_UPDATE: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: 'updateDeliveryProvider',
    message: (p) =>
      `Delivery provider updated: ${entityLabel(p.deliveryProvider, p.deliveryProviderId)}`,
  },
  DELIVERY_PROVIDER_REMOVE: {
    activity: OCSF_API_ACTIVITY.DELETE,
    operation: 'removeDeliveryProvider',
    message: (p) =>
      `Delivery provider removed: ${entityLabel(p.deliveryProvider, p.deliveryProviderId)}`,
  },
  WAREHOUSING_PROVIDER_CREATE: {
    activity: OCSF_API_ACTIVITY.CREATE,
    operation: 'createWarehousingProvider',
    message: (p) => `Warehousing provider created: ${entityLabel(p.warehousingProvider)}`,
  },
  WAREHOUSING_PROVIDER_UPDATE: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: 'updateWarehousingProvider',
    message: (p) =>
      `Warehousing provider updated: ${entityLabel(p.warehousingProvider, p.warehousingProviderId)}`,
  },
  WAREHOUSING_PROVIDER_REMOVE: {
    activity: OCSF_API_ACTIVITY.DELETE,
    operation: 'removeWarehousingProvider',
    message: (p) =>
      `Warehousing provider removed: ${entityLabel(p.warehousingProvider, p.warehousingProviderId)}`,
  },

  // Tokens
  TOKEN_OWNERSHIP_CHANGED: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: 'transferToken',
    message: (p) => `Token ownership changed: ${entityLabel(p.token, p.tokenId)}`,
  },
  TOKEN_INVALIDATED: {
    activity: OCSF_API_ACTIVITY.DELETE,
    operation: 'invalidateToken',
    message: (p) => `Token invalidated: ${entityLabel(p.token, p.tokenId)}`,
  },

  // Enrollments
  ENROLLMENT_CREATE: {
    activity: OCSF_API_ACTIVITY.CREATE,
    operation: 'createEnrollment',
    message: (p) => `Enrollment created: ${entityLabel(p.enrollment)}`,
  },
  ENROLLMENT_UPDATE: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: 'updateEnrollment',
    message: (p) => `Enrollment updated: ${entityLabel(p.enrollment, p.enrollmentId)}`,
  },
  ENROLLMENT_REMOVE: {
    activity: OCSF_API_ACTIVITY.DELETE,
    operation: 'removeEnrollment',
    message: (p) => `Enrollment removed: ${entityLabel(p.enrollment, p.enrollmentId)}`,
  },

  // Quotations
  QUOTATION_REQUEST_CREATE: {
    activity: OCSF_API_ACTIVITY.CREATE,
    operation: 'createQuotation',
    message: (p) => `Quotation created: ${entityLabel(p.quotation)}`,
  },
  QUOTATION_UPDATE: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: 'updateQuotation',
    message: (p) => `Quotation updated: ${entityLabel(p.quotation, p.quotationId)}`,
  },

  // Assortments
  ASSORTMENT_CREATE: {
    activity: OCSF_API_ACTIVITY.CREATE,
    operation: 'createAssortment',
    message: (p) => `Assortment created: ${entityLabel(p.assortment)}`,
  },
  ASSORTMENT_UPDATE: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: 'updateAssortment',
    message: (p) => `Assortment updated: ${entityLabel(p.assortment, p.assortmentId)}`,
  },
  ASSORTMENT_REMOVE: {
    activity: OCSF_API_ACTIVITY.DELETE,
    operation: 'removeAssortment',
    message: (p) => `Assortment removed: ${entityLabel(p.assortment, p.assortmentId)}`,
  },

  // Filters
  FILTER_CREATE: {
    activity: OCSF_API_ACTIVITY.CREATE,
    operation: 'createFilter',
    message: (p) => `Filter created: ${entityLabel(p.filter)}`,
  },
  FILTER_UPDATE: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: 'updateFilter',
    message: (p) => `Filter updated: ${entityLabel(p.filter, p.filterId)}`,
  },
  FILTER_REMOVE: {
    activity: OCSF_API_ACTIVITY.DELETE,
    operation: 'removeFilter',
    message: (p) => `Filter removed: ${entityLabel(p.filter, p.filterId)}`,
  },

  // Files
  FILE_CREATE: {
    activity: OCSF_API_ACTIVITY.CREATE,
    operation: 'createFile',
    message: (p) => `File created: ${entityLabel(p.file, p.fileId)}`,
  },
  FILE_REMOVE: {
    activity: OCSF_API_ACTIVITY.DELETE,
    operation: 'removeFile',
    message: (p) => `File removed: ${entityLabel(p.file, p.fileId)}`,
  },

  // System configuration
  COUNTRY_CREATE: {
    activity: OCSF_API_ACTIVITY.CREATE,
    operation: 'createCountry',
    message: (p) => `Country created: ${entityLabel(p.country, p.countryId)}`,
  },
  COUNTRY_UPDATE: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: 'updateCountry',
    message: (p) => `Country updated: ${entityLabel(p.country, p.countryId)}`,
  },
  COUNTRY_REMOVE: {
    activity: OCSF_API_ACTIVITY.DELETE,
    operation: 'removeCountry',
    message: (p) => `Country removed: ${entityLabel(p.country, p.countryId)}`,
  },
  CURRENCY_CREATE: {
    activity: OCSF_API_ACTIVITY.CREATE,
    operation: 'createCurrency',
    message: (p) => `Currency created: ${entityLabel(p.currency, p.currencyId)}`,
  },
  CURRENCY_UPDATE: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: 'updateCurrency',
    message: (p) => `Currency updated: ${entityLabel(p.currency, p.currencyId)}`,
  },
  CURRENCY_REMOVE: {
    activity: OCSF_API_ACTIVITY.DELETE,
    operation: 'removeCurrency',
    message: (p) => `Currency removed: ${entityLabel(p.currency, p.currencyId)}`,
  },
  LANGUAGE_CREATE: {
    activity: OCSF_API_ACTIVITY.CREATE,
    operation: 'createLanguage',
    message: (p) => `Language created: ${entityLabel(p.language, p.languageId)}`,
  },
  LANGUAGE_UPDATE: {
    activity: OCSF_API_ACTIVITY.UPDATE,
    operation: 'updateLanguage',
    message: (p) => `Language updated: ${entityLabel(p.language, p.languageId)}`,
  },
  LANGUAGE_REMOVE: {
    activity: OCSF_API_ACTIVITY.DELETE,
    operation: 'removeLanguage',
    message: (p) => `Language removed: ${entityLabel(p.language, p.languageId)}`,
  },
};

/**
 * Configure automatic audit logging for Unchained events.
 *
 * Subscribes to relevant events and creates OCSF audit log entries.
 * Call once during application startup after creating the audit log.
 */
export function configureAuditIntegration(auditLog: AuditLog): void {
  const subscribedEvents = new Set<string>();

  const sub = (event: string, handler: (payload: Record<string, any>) => Promise<void>) => {
    try {
      EventDirector.subscribe(event, async ({ payload }) => {
        try {
          await handler(payload);
        } catch (error) {
          logger.error(`Audit log error for ${event}: ${error}`);
        }
      });
      subscribedEvents.add(event);
    } catch {
      // Event not registered — skip
    }
  };

  // --- Authentication events (special shape) ---

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

  // --- Account change events (special shape) ---

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

  // --- API activity events (data-driven) ---

  for (const [event, mapping] of Object.entries(API_EVENT_MAP)) {
    sub(event, async (p) => {
      const ctx = extractContext(p);

      let message: string;
      let data: Record<string, any> | null = null;
      if (mapping.trackChangedFields) {
        const entity = mapping.entityKey ? p[mapping.entityKey] : undefined;
        const idKey = mapping.entityIdKey ? p[mapping.entityIdKey] : undefined;
        const changed = changedFields(p, [
          mapping.entityKey || '',
          mapping.entityIdKey || '',
          ...PAYLOAD_META_KEYS,
        ]);
        message = `${mapping.operation
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (s) => s.toUpperCase())
          .trim()}: ${entityLabel(entity, idKey)}${changed.label}`;
        data = changed.data;
      } else if (typeof mapping.message === 'function') {
        message = mapping.message(p);
      } else {
        message = mapping.message;
      }

      await auditLog.logApiActivity({
        activity: mapping.activity,
        ...ctx,
        userId: mapping.useOrderUserId ? p.order?.userId || ctx.userId : ctx.userId,
        success: mapping.success ?? true,
        operation: mapping.operation || p.action || 'unknown',
        message,
        ...(data ? { data } : {}),
      });
    });
  }

  // Verify all advertised events are actually subscribed
  const missing = AUDITED_EVENTS.filter((e) => !subscribedEvents.has(e));
  if (missing.length > 0) {
    logger.warn(
      `Audit integration: ${missing.length} advertised events not registered: ${missing.join(', ')}`,
    );
  }
  logger.info(
    `Audit integration configured: ${subscribedEvents.size}/${AUDITED_EVENTS.length} events subscribed`,
  );
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
  'PRODUCT_UPDATE_TEXT',
  'PRODUCT_UPDATE_MEDIA_TEXT',
  'PRODUCT_ADD_MEDIA',
  'PRODUCT_REMOVE_MEDIA',
  'PRODUCT_REORDER_MEDIA',
  'PRODUCT_ADD_ASSIGNMENT',
  'PRODUCT_REMOVE_ASSIGNMENT',
  'PRODUCT_CREATE_BUNDLE_ITEM',
  'PRODUCT_REMOVE_BUNDLE_ITEM',
  'PRODUCT_CREATE_VARIATION',
  'PRODUCT_REMOVE_VARIATION',
  'PRODUCT_VARIATION_OPTION_CREATE',
  'PRODUCT_REMOVE_VARIATION_OPTION',
  'PRODUCT_UPDATE_VARIATION_TEXT',
  'PRODUCT_REVIEW_CREATE',
  'PRODUCT_UPDATE_REVIEW',
  'PRODUCT_REMOVE_REVIEW',
  'PRODUCT_REVIEW_ADD_VOTE',
  'PRODUCT_REMOVE_REVIEW_VOTE',

  // Assortment sub-events
  'ASSORTMENT_UPDATE_TEXT',
  'ASSORTMENT_UPDATE_MEDIA_TEXT',
  'ASSORTMENT_ADD_PRODUCT',
  'ASSORTMENT_REMOVE_PRODUCT',
  'ASSORTMENT_ADD_LINK',
  'ASSORTMENT_REMOVE_LINK',
  'ASSORTMENT_ADD_FILTER',
  'ASSORTMENT_REMOVE_FILTER',
  'ASSORTMENT_ADD_MEDIA',
  'ASSORTMENT_REMOVE_MEDIA',
  'ASSORTMENT_REORDER_PRODUCTS',
  'ASSORTMENT_REORDER_LINKS',
  'ASSORTMENT_REORDER_FILTERS',
  'ASSORTMENT_REORDER_MEDIA',

  // Filter sub-events
  'FILTER_UPDATE_TEXT',

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
