import { ApolloError } from 'apollo-server-express';

export const createError = (code, message) =>
  class extends ApolloError {
    constructor({ data, message: explicitMessage }) {
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
export const ProductWrongStatusError = createError(
  'ProductWrongStatusError',
  'The current status of the product does not allow this operation'
);
export const AssortmentNotFoundError = createError(
  'AssortmentNotFoundError',
  'Assortment not found'
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
export const OrderWrongStatusError = createError(
  'OrderWrongStatusError',
  'The current status of the order does not allow this operation'
);
export const OrderCheckoutError = createError(
  'OrderCheckoutError',
  'A problem occured while processing the order'
);
export const PaypalConfigurationError = createError(
  'PaypalConfigurationError',
  'PayPal configuration invalid'
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
