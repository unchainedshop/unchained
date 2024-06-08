export default [
  /* GraphQL */ `
    input SortOptionInput {
      key: String!
      value: SortDirection!
    }

    input UserProfileInput {
      displayName: String
      birthday: Timestamp
      phoneMobile: String
      gender: String
      address: AddressInput
    }

    input AddressInput {
      firstName: String
      lastName: String
      company: String
      addressLine: String
      addressLine2: String
      postalCode: String
      regionCode: String
      city: String
      countryCode: String
    }

    input ContactInput {
      emailAddress: String
      telNumber: String
    }

    input CreateLanguageInput {
      isoCode: String!
    }
    input UpdateLanguageInput {
      isoCode: String!
      isActive: Boolean
    }

    input CreateCountryInput {
      isoCode: String!
    }
    input UpdateCountryInput {
      isoCode: String!
      isActive: Boolean
      defaultCurrencyId: String
    }

    input CreateCurrencyInput {
      isoCode: String!
      contractAddress: String
      decimals: Int
    }
    input UpdateCurrencyInput {
      isoCode: String!
      isActive: Boolean
      contractAddress: String
      decimals: Int
    }

    input CreateProductInput {
      type: String!
      tags: [LowerCaseString!]
    }

    input VariationTextInput {
      locale: String!
      title: String
      subtitle: String
    }

    input CreateProductVariationInput {
      key: String!
      type: ProductVariationType!
    }

    input ProductAssignmentVectorInput {
      key: String!
      value: String!
    }

    input UpdateProductInput {
      tags: [LowerCaseString!]
      sequence: Int
      meta: JSON
    }

    input ProductTextInput {
      locale: String!
      slug: String
      title: String
      subtitle: String
      description: String
      vendor: String
      brand: String
      labels: [String!]
    }

    input UpdateProductMediaTextInput {
      locale: String!
      title: String
      subtitle: String
    }

    input UpdateProductVariationTextInput {
      locale: String!
      title: String
      subtitle: String
    }

    input UpdateProductCommercePricingInput {
      amount: Int!
      maxQuantity: Int
      isTaxable: Boolean
      isNetPrice: Boolean
      currencyCode: String!
      countryCode: String!
    }

    input UpdateProductCommerceInput {
      pricing: [UpdateProductCommercePricingInput!]!
    }

    input UpdateProductSupplyInput {
      weightInGram: Int
      heightInMillimeters: Int
      lengthInMillimeters: Int
      widthInMillimeters: Int
    }

    input UpdateProductWarehousingInput {
      sku: String
      baseUnit: String
    }

    input ReorderProductMediaInput {
      productMediaId: ID!
      sortKey: Int!
    }

    input CreateWarehousingProviderInput {
      type: WarehousingProviderType!
      adapterKey: String!
    }

    input CreateDeliveryProviderInput {
      type: DeliveryProviderType!
      adapterKey: String!
    }

    input CreatePaymentProviderInput {
      type: PaymentProviderType!
      adapterKey: String!
    }

    input UpdateProviderInput {
      configuration: [JSON!]
    }

    input CreateAssortmentInput {
      isRoot: Boolean
      tags: [LowerCaseString!]
    }

    input UpdateAssortmentInput {
      isRoot: Boolean
      tags: [LowerCaseString!]
      isActive: Boolean
      sequence: Int
    }

    input AssortmentTextInput {
      locale: String!
      slug: String
      title: String
      subtitle: String
      description: String
    }

    input ReorderAssortmentProductInput {
      assortmentProductId: ID!
      sortKey: Int!
    }

    input ReorderAssortmentFilterInput {
      assortmentFilterId: ID!
      sortKey: Int!
    }

    input ReorderAssortmentLinkInput {
      assortmentLinkId: ID!
      sortKey: Int!
    }

    input UpdateAssortmentMediaTextInput {
      locale: String!
      title: String
      subtitle: String
    }

    input ReorderAssortmentMediaInput {
      assortmentMediaId: ID!
      sortKey: Int!
    }

    input CreateFilterInput {
      key: String!
      type: FilterType!
      options: [String!]
    }

    input UpdateFilterInput {
      isActive: Boolean
      key: String
    }

    input FilterTextInput {
      locale: String!
      title: String
      subtitle: String
    }

    input ProductConfigurationParameterInput {
      key: String!
      value: String!
    }

    input ProductReviewInput {
      rating: Int
      title: String
      review: String
    }

    input FilterQueryInput {
      key: String!
      value: String
    }

    input CreateProductBundleItemInput {
      productId: ID!
      quantity: Int!
    }

    input EnrollmentDeliveryInput {
      deliveryProviderId: ID!
      meta: JSON
    }

    input EnrollmentPaymentInput {
      paymentProviderId: ID!
      meta: JSON
    }

    input EnrollmentPlanInput {
      productId: ID!
      quantity: Int = 1
      configuration: [ProductConfigurationParameterInput!]
    }

    input OrderItemInput {
      productId: ID!
      quantity: Int = 1
      configuration: [ProductConfigurationParameterInput!]
    }

    input DateFilterInput {
      start: DateTime
      end: DateTime
    }
  `,
];
