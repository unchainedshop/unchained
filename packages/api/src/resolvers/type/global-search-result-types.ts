import { ProductType } from '@unchainedshop/core-products';

const productTypeMap: Record<string, string> = {
  [ProductType.CONFIGURABLE_PRODUCT]: 'ConfigurableProduct',
  [ProductType.BUNDLE_PRODUCT]: 'BundleProduct',
  [ProductType.PLAN_PRODUCT]: 'PlanProduct',
  [ProductType.TOKENIZED_PRODUCT]: 'TokenizedProduct',
};

export const GlobalSearchResult = {
  __resolveType(obj: Record<string, any>): string {
    if (obj.emails || obj.username || obj.lastLogin) return 'User';
    if (obj.orderNumber != null || obj.paymentId || obj.deliveryId) return 'Order';
    if (obj.isRoot !== undefined) return 'Assortment';
    if (obj.key && obj.options) return 'Filter';
    if (obj.billingAddress) return 'Enrollment';
    if (obj.priority != null && obj.scheduled) return 'Work';
    if (obj.quotationNumber != null || obj.expires) return 'Quotation';
    return productTypeMap[obj.type] || 'SimpleProduct';
  },
};
