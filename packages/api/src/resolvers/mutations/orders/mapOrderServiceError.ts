import {
  DeliverProviderNotFoundError,
  OrderDeliveryNotFoundError,
  OrderDeliveryTypeError,
  OrderPaymentNotFoundError,
  OrderPaymentTypeError,
  OrderQuantityTooLowError,
  PaymentProviderNotFoundError,
  ProductNotFoundError,
} from '../../../errors.ts';

const rethrowAs =
  (apiErrors: Record<string, new (details?: Record<string, unknown>) => Error>) =>
  (error: Error & { details?: Record<string, unknown> }): never => {
    const APIError = apiErrors[error.name];
    throw APIError ? new APIError(error.details) : error;
  };

export const rethrowCartProductError = rethrowAs({
  ProductNotFoundError,
  InvalidQuantityError: OrderQuantityTooLowError,
});

export const rethrowDeliveryProviderError = rethrowAs({
  DeliveryProviderNotFoundError: DeliverProviderNotFoundError,
  DeliveryProviderTypeError: OrderDeliveryTypeError,
  DeliveryProviderNotSupportedError: OrderDeliveryTypeError,
  OrderDeliveryNotFoundError,
});

export const rethrowPaymentProviderError = rethrowAs({
  PaymentProviderNotFoundError,
  PaymentProviderTypeError: OrderPaymentTypeError,
  PaymentProviderNotSupportedError: OrderPaymentTypeError,
  OrderPaymentNotFoundError,
});
