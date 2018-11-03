import { ApolloError } from 'apollo-server';

const createError = (code, { message }) => class extends ApolloError {
  constructor({ data }) {
    super(message, code, data);
  }
};

export const PermissionSystemError = createError('PermissionSystemError', 'Permission System Error');
export const NoPermissionError = createError('NoPermissionError', 'Not authorized');
export const ProductNotFoundError = createError('ProductNotFoundError', 'Product not found');
export const ProductWrongStatusError = createError('ProductWrongStatusError', 'The current status of the product does not allow this operation');
export const AssortmentNotFoundError = createError('AssortmentNotFoundError', 'Assortment not found');
export const UserNotFoundError = createError('UserNotFoundError', 'Product not found');
export const UserNoCartError = createError('UserNoCartError', 'No open cart available to checkout');
export const OrderItemNotFound = createError('OrderItemNotFound', 'Order Item not found');
export const OrderNotFoundError = createError('OrderNotFoundError', 'Order not found');
export const OrderDeliveryNotFoundError = createError('OrderDeliveryNotFoundError', 'Order delivery not found');
export const OrderPaymentNotFoundError = createError('OrderDeliveryNotFoundError', 'Order delivery not found');
export const OrderQuantityTooLowError = createError('OrderQuantityTooLowError', 'Quantity has to be 0 or greater');
export const OrderWrongPaymentStatusError = createError('OrderWrongPaymentStatus', 'The current status of the payment does not allow this operation');
export const OrderWrongStatusError = createError('OrderWrongStatusError', 'The current status of the order does not allow this operation');
export const OrderCheckoutError = createError('OrderCheckoutError', 'A problem occured while processing the order');
export const PaypalConfigurationError = createError('PaypalConfigurationError', 'PayPal configuration invalid');
