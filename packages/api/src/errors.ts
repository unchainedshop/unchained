import { GraphQLError } from 'graphql';

export const createError = (code: string, message: string): any =>
  class extends GraphQLError {
    constructor({ message: explicitMessage, ...data }) {
      super(explicitMessage || message, {
        extensions: {
          code,
          ...data,
        },
      });
    }
  };

export const PermissionSystemError = createError('PermissionSystemError', 'Permission System Error');
export const NoPermissionError = createError('NoPermissionError', 'Not authorized');
export const ProductNotFoundError = createError('ProductNotFoundError', 'Product not found');

export const ProductVariationNotFoundError = createError(
  'ProductVariationNotFoundError',
  'Product variation not found',
);

export const ProductMediaNotFoundError = createError(
  'ProductMediaNotFoundError',
  'Product media not found',
);

export const ProductReviewNotFoundError = createError(
  'ProductReviewNotFoundError',
  'ProductReview not found',
);
export const ProductWrongStatusError = createError(
  'ProductWrongStatusError',
  'The current status of the product does not allow this operation',
);

export const ProductWrongTypeError = createError(
  'ProductWrongTypeError',
  'The current type of the product does not allow this operation',
);

export const AssortmentNotFoundError = createError('AssortmentNotFoundError', 'Assortment not found');

export const AssortmentFilterNotFoundError = createError(
  'AssortmentFilterNotFoundError',
  'Assortment filter not found',
);

export const AssortmentLinkNotFoundError = createError(
  'AssortmentLinkNotFoundError',
  'Assortment link not found',
);

export const AssortmentProductNotFoundError = createError(
  'AssortmentProductNotFoundError',
  'Assortment product not found',
);

export const AssortmentMediaNotFoundError = createError(
  'AssortmentMediaNotFoundError',
  'Assortment media not found',
);
export const FilterNotFoundError = createError('FilterNotFoundError', 'Filter not found');

export const CountryNotFoundError = createError('CountryNotFoundError', 'Country not found');
export const CurrencyNotFoundError = createError('CurrencyNotFoundError', 'Currency not found');

export const DeliverProviderNotFoundError = createError(
  'DeliverProviderNotFoundError',
  'Delivery provider not found',
);

export const LanguageNotFoundError = createError('LanguageNotFoundError', 'Language not found');

export const UserNotFoundError = createError('UserNotFoundError', 'User not found');
export const UserWebAuthnCredentialsNotFoundError = createError(
  'UserWebAuthnCredentialsNotFoundError',
  'User WebAuth Credentials not found',
);

export const WebAuthnDisabledError = createError('WebAuthnDisabledError', 'WebAuthn disabled');

export const UserWeb3AddressNotFoundError = createError(
  'UserWeb3AddressNotFoundError',
  'Web3 Account not found for User',
);

export const UserWeb3InvalidAddressError = createError(
  'UserWeb3InvalidAddressError',
  'Invalid address provided',
);

export const UserWeb3AddressSignatureError = createError(
  'UserWeb3AddressSignatureError',
  'Signature does not match web3 account / is invalid',
);

export const UserNoCartError = createError('UserNoCartError', 'No open cart available to checkout');
export const OrderItemNotFoundError = createError('OrderItemNotFoundError', 'Order Item not found');
export const OrderNotFoundError = createError('OrderNotFoundError', 'Order not found');
export const OrderNumberAlreadyExistsError = createError(
  'OrderNumberAlreadyExistsError',
  'This orderNumber has already been used by another order',
);

export const OrderDiscountNotFoundError = createError(
  'OrderDiscountNotFoundError',
  'Order discount not found',
);

export const OrderDiscountCodeNotValidError = createError(
  'OrderDiscountCodeNotValidError',
  'Order discount code not valid',
);

export const OrderDiscountCodeAlreadyPresentError = createError(
  'OrderDiscountCodeAlreadyPresentError',
  'Order discount code already present',
);

export const OrderDeliveryNotFoundError = createError(
  'OrderDeliveryNotFoundError',
  'Order delivery not found',
);
export const OrderPaymentNotFoundError = createError(
  'OrderPaymentNotFoundError',
  'Order payment not found',
);

export const OrderPaymentTypeError = createError(
  'OrderPaymentTypeError',
  'The current type of the order payment does not allow this operation',
);

export const OrderQuantityTooLowError = createError(
  'OrderQuantityTooLowError',
  'Quantity cannot be lower than 1',
);
export const OrderWrongPaymentStatusError = createError(
  'OrderWrongPaymentStatus',
  'The current status of the payment does not allow this operation',
);
export const OrderWrongDeliveryStatusError = createError(
  'OrderWrongDeliveryStatus',
  'The current status of the delivery does not allow this operation',
);

export const OrderDeliveryTypeError = createError(
  'OrderDeliveryTypeError',
  'The current type of the order delivery does not allow this operation',
);

export const OrderWrongStatusError = createError(
  'OrderWrongStatusError',
  'The current status of the order does not allow this operation',
);
export const OrderCheckoutError = createError(
  'OrderCheckoutError',
  'A problem occured while processing the order',
);
export const OrderPaymentConfigurationError = createError(
  'OrderPaymentConfigurationError',
  'Payment configuration invalid',
);
export const QuotationWrongStatusError = createError(
  'QuotationWrongStatusError',
  'The current status of the quotation does not allow this operation',
);
export const QuotationNotFoundError = createError('QuotationNotFoundError', 'Quotation not found');
export const BookmarkAlreadyExistsError = createError(
  'BookmarkAlreadyExistsError',
  'Bookmark already exists',
);
export const BookmarkNotFoundError = createError('BookmarkNotFoundError', 'Bookmark not found');
export const MultipleBookmarksFound = createError(
  'MultipleBookmarksFound',
  'The convenience bookmark mutation cannot be used because multiple bookmarks were explicitly created with different metadata',
);

export const QueryStringRequiredError = createError(
  'QueryStringRequiredError',
  'Query string is required when no assortments are in scope',
);
export const PaymentProviderNotFoundError = createError(
  'PaymentProviderNotFoundError',
  'Payment provider not found',
);
export const WorkNotFoundOrWrongStatus = createError(
  'WorkNotFoundOrWrongStatus',
  'Could not find work or no work with the correct status',
);

export const WorkNotFoundError = createError('WorkNotFoundError', 'Work not found');

export const WorkTypeInvalidError = createError('WorkTypeInvalidError', 'Work type invalid');

export const PaymentCredentialsNotFoundError = createError(
  'PaymentCredentialsNotFoundError',
  'Payment credentials not found',
);
export const EnrollmentWrongStatusError = createError(
  'EnrollmentWrongStatusError',
  'The current status of the enrollment does not allow this operation',
);
export const EnrollmentNotFoundError = createError('EnrollmentNotFoundError', 'Enrollment not found');

export const WarehousingProviderNotFoundError = createError(
  'WarehousingProviderNotFoundError',
  'Warehousing provider not found',
);

export const InvalidIdError = createError('InvalidIdError', 'Invalid ID provided');

export const ProviderConfigurationInvalid = createError(
  'ProviderConfigurationInvalid',
  'Provider Configuration invalid (check if the Adapter Key exists)',
);

export const TokenWrongStatusError = createError(
  'TokenWrongStatusError',
  'The current status of the token does not allow this operation',
);

export const TokenNotFoundError = createError('TokenNotFoundError', 'Token not found');

export const CyclicAssortmentLinkNotSupportedError = createError(
  'CyclicAssortmentLinkNotSupported',
  'Cyclic assortment link detected, make sure child assortment is not assigned as a parent on the assortment graph',
);

export const EmailAlreadyExistsError = createError(
  'EmailAlreadyExists',
  'Email already exists or is invalid',
);

export const UsernameAlreadyExistsError = createError(
  'UsernameAlreadyExists',
  'Username already exists or is invalid',
);

export const UsernameOrEmailRequiredError = createError(
  'UsernameOrEmailRequired',
  'No username or email is provided.',
);

export const PasswordInvalidError = createError(
  'PasswordInvalidError',
  'The provided password is invalid, maybe too insecure',
);

export const PasswordOrWebAuthnPublicKeyRequiredError = createError(
  'PasswordOrWebAuthnPublicKeyRequired',
  'A password or a WebAuthn public key is required',
);

export const InvalidCredentialsError = createError('InvalidCredentials', 'Invalid credentials provided');

export const InvalidResetTokenError = createError('InvalidResetTokenError', 'Token invalid or expired');

export const InvalidEmailVerificationTokenError = createError(
  'InvalidEmailVerificationTokenError',
  'Token invalid or expired',
);

export const NoEmailSetError = createError('NoEmailSet', 'User has no email set');

export const ResetPasswordLinkUnknownAddressError = createError(
  'ResetPasswordLinkUnknownAddress',
  'Valid token but no email address found for the entry',
);

export const AuthenticationFailedError = createError(
  'AuthenticationFailed',
  'Failed to authenticate the user',
);

export const UserDeactivatedError = createError(
  'UserDeactivatedError',
  'User is deactivated, so not allowed to login',
);

export const AuthOperationFailedError = createError(
  'AuthOperationFailed',
  'Operation failed, please make sure you have provided all required parameters',
);

export const ProductLinkedToActiveVariationError = createError(
  'ProductLinkedToActiveVariation',
  'Product is part of a active variation, remove it from any active/draft variation before deleting',
);

export const ProductLinkedToActiveBundleError = createError(
  'ProductLinkedToActiveBundle',
  'Product is part of a active/draft bundle item, remove it from any active/draft bundle item before deleting',
);

export const ProductLinkedToEnrollmentError = createError(
  'ProductLinkedToEnrollment',
  'Product is part of a active/paused subscriptions item, remove it from any active/paused subscriptions item before deleting',
);

export const ProductLinkedToQuotationError = createError(
  'ProductLinkedToQuotation',
  'Product is part of a requested/proposed quotations item, remove it from any requested/proposed quotations item before deleting',
);

export const ProductVariationVectorAlreadySet = createError(
  'ProductVariationVectorAlreadySet',
  'Product variation vector is already set, remove the existing one before setting a new one',
);

export const ProductVariationVectorInvalid = createError(
  'ProductVariationVectorInvalid',
  'Product variation vector is invalid/incomplete',
);

export const FileNotFoundError = createError('FileNotFoundError', 'File not found');

export const FileUploadExpiredError = createError('FileUploadExpired', 'File upload has expired');

export const ImpersonatingAdminUserError = createError(
  'ImpersonatingAdminUserError',
  'Can not impersonate a admin user account',
);
