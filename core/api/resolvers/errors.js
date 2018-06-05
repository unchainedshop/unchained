import { createError } from 'apollo-errors';

export const PermissionSystemError = createError('PermissionSystemError', {
  message: 'Permission System Error',
});

export const NoPermissionError = createError('NoPermissionError', {
  message: 'Not authorized',
});

export const ProductNotFoundError = createError('ProductNotFoundError', {
  message: 'Product not found',
});

export const ProductWrongStatusError = createError('ProductWrongStatusError', {
  message: 'The current status of the product does not allow this operation',
});

export const AssortmentNotFoundError = createError('AssortmentNotFoundError', {
  message: 'Assortment not found',
});

export const UserNotFoundError = createError('UserNotFoundError', {
  message: 'Product not found',
});

export const UserNoCartError = createError('UserNoCartError', {
  message: 'No open cart available to checkout',
});

export const OrderItemNotFound = createError('OrderItemNotFound', {
  message: 'Order Item not found',
});

export const OrderNotFoundError = createError('OrderNotFoundError', {
  message: 'Order not found',
});

export const OrderDeliveryNotFoundError = createError('OrderDeliveryNotFoundError', {
  message: 'Order delivery not found',
});

export const OrderPaymentNotFoundError = createError('OrderDeliveryNotFoundError', {
  message: 'Order delivery not found',
});

export const OrderQuantityTooLowError = createError('OrderQuantityTooLowError', {
  message: 'Quantity has to be 0 or greater',
});

export const OrderWrongPaymentStatusError = createError('OrderWrongPaymentStatus', {
  message: 'The current status of the payment does not allow this operation',
});

export const OrderWrongStatusError = createError('OrderWrongStatusError', {
  message: 'The current status of the order does not allow this operation',
});

export const OrderCheckoutError = createError('OrderCheckoutError', {
  message: 'A problem occured while processing the order',
});

export const PaypalConfigurationError = createError('PaypalConfigurationError', {
  message: 'PayPal configuration invalid',
});
