import {
  DeliverProviderNotFoundError,
  OrderDeliveryNotFoundError,
  OrderDeliveryTypeError,
  OrderItemNotFoundError,
  OrderNotFoundError,
  OrderPaymentNotFoundError,
  OrderPaymentTypeError,
  OrderQuantityTooLowError,
  OrderWrongStatusError,
  PaymentProviderNotFoundError,
  ProductNotFoundError,
} from '../../../errors.ts';

type ServiceError = Error & { details?: Record<string, any> };

const throwMapped = (
  error: unknown,
  mappings: Record<string, new (details?: Record<string, any>) => Error>,
): never => {
  const serviceError = error as ServiceError;
  const APIError = mappings[serviceError.name];
  if (APIError) throw new APIError(serviceError.details);
  throw error;
};

export const rethrowCartProductServiceError = (error: unknown): never =>
  throwMapped(error, {
    ProductNotFoundError,
    InvalidQuantityError: OrderQuantityTooLowError,
    OrderItemNotFoundError,
    OrderNotFoundError,
    OrderWrongStatusError,
  });

export const rethrowDeliveryProviderServiceError = (
  error: unknown,
  { generic = false }: { generic?: boolean } = {},
): never =>
  throwMapped(error, {
    DeliveryProviderNotFoundError: generic ? DeliverProviderNotFoundError : OrderDeliveryTypeError,
    DeliveryProviderTypeError: OrderDeliveryTypeError,
    DeliveryProviderNotSupportedError: OrderDeliveryTypeError,
    OrderDeliveryNotFoundError,
    OrderNotFoundError,
    OrderWrongStatusError,
  });

export const rethrowPaymentProviderServiceError = (
  error: unknown,
  { generic = false }: { generic?: boolean } = {},
): never =>
  throwMapped(error, {
    PaymentProviderNotFoundError: generic ? PaymentProviderNotFoundError : OrderPaymentTypeError,
    PaymentProviderTypeError: OrderPaymentTypeError,
    PaymentProviderNotSupportedError: OrderPaymentTypeError,
    OrderPaymentNotFoundError,
    OrderNotFoundError,
    OrderWrongStatusError,
  });
