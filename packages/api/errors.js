import { ApolloError } from 'apollo-server-express';

export const createError = (code, message) =>
  class extends ApolloError {
    constructor({ message: explicitMessage, ...data }) {
      super(explicitMessage || message, code, data);
    }
  };

export const PermissionSystemError = createError(
  'PermissionSystemError',
  'Permission System Error'
);
export const NoPermissionError = createError(
  'NoPermissionError',
  'Not authorized'
);
export const ProductNotFoundError = createError(
  'ProductNotFoundError',
  'Product not found'
);
export const ProductReviewNotFoundError = createError(
  'ProductReviewNotFoundError',
  'ProductReview not found'
);
export const ProductWrongStatusError = createError(
  'ProductWrongStatusError',
  'The current status of the product does not allow this operation'
);
export const AssortmentNotFoundError = createError(
  'AssortmentNotFoundError',
  'Assortment not found'
);

export const FilterNotFoundError = createError(
  'FilterNotFoundError',
  'Filter not found'
);
export const UserNotFoundError = createError(
  'UserNotFoundError',
  'Product not found'
);
export const UserNoCartError = createError(
  'UserNoCartError',
  'No open cart available to checkout'
);
export const OrderItemNotFoundError = createError(
  'OrderItemNotFoundError',
  'Order Item not found'
);
export const OrderNotFoundError = createError(
  'OrderNotFoundError',
  'Order not found'
);
export const OrderNumberAlreadyExistsError = createError(
  'OrderNumberAlreadyExistsError',
  'This orderNumber has already been used by another order'
);
export const OrderDiscountNotFoundError = createError(
  'OrderDiscountNotFoundError',
  'Order discount not found'
);
export const OrderDeliveryNotFoundError = createError(
  'OrderDeliveryNotFoundError',
  'Order delivery not found'
);
export const OrderPaymentNotFoundError = createError(
  'OrderDeliveryNotFoundError',
  'Order delivery not found'
);
export const OrderQuantityTooLowError = createError(
  'OrderQuantityTooLowError',
  'Quantity cannot be lower than 1'
);
export const OrderWrongPaymentStatusError = createError(
  'OrderWrongPaymentStatus',
  'The current status of the payment does not allow this operation'
);
export const OrderWrongDeliveryStatusError = createError(
  'OrderWrongDeliveryStatus',
  'The current status of the delivery does not allow this operation'
);
export const OrderWrongStatusError = createError(
  'OrderWrongStatusError',
  'The current status of the order does not allow this operation'
);
export const OrderCheckoutError = createError(
  'OrderCheckoutError',
  'A problem occured while processing the order'
);
export const OrderPaymentConfigurationError = createError(
  'OrderPaymentConfigurationError',
  'Payment configuration invalid'
);
export const QuotationWrongStatusError = createError(
  'QuotationWrongStatusError',
  'The current status of the quotation does not allow this operation'
);
export const QuotationNotFoundError = createError(
  'QuotationNotFoundError',
  'Quotation not found'
);
export const BookmarkAlreadyExistsError = createError(
  'BookmarkAlreadyExistsError',
  'Bookmark already exists'
);
export const BookmarkNotFoundError = createError(
  'BookmarkNotFoundError',
  'Bookmark not found'
);
export const QueryStringRequiredError = createError(
  'QueryStringRequiredError',
  'Query string is required if no assortmentId is provided'
);
export const PaymentProviderNotFoundError = createError(
  'PaymentProviderNotFoundError',
  'Payment provider not found'
);
export const WorkNotFoundOrWrongStatus = createError(
  'WorkNotFoundOrWrongStatus',
  'Could not find work or no work with the correct status'
);
export const PaymentCredentialsNotFoundError = createError(
  'PaymentCredentialsNotFoundError',
  'Payment credentials not found'
);
export const SubscriptionWrongStatusError = createError(
  'SubscriptionWrongStatusError',
  'The current status of the subscription does not allow this operation'
);
export const SubscriptionNotFoundError = createError(
  'SubscriptionNotFoundError',
  'Subscription not found'
);
