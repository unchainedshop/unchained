export interface Step {
  id: string;
  title: string;
  description: string;
  isComplete: boolean;
  isRequired: boolean;
  setupUrl: string;
  category: 'essential' | 'commerce' | 'content';
  estimatedTime: string;
  icon: string;
  completedAt?: string;
}

export interface ConfigurationStep {
  [key: string]: Step;
}

export interface ShopConfiguration {
  steps: ConfigurationStep;
  overallProgress: number;
  isFullyConfigured: boolean;
  essentialStepsComplete: boolean;
  commerceStepsComplete: boolean;
  contentStepsComplete: boolean;
  essentialSteps: Step[];
  commerceSteps: Step[];
  contentSteps: Step[];
  completedSteps: Step[];
}

const getSetupStepsConfigurationsMeta = (formatMessage): ConfigurationStep => {
  return {
    currenciesCount: {
      id: 'currencies',
      title: formatMessage({ id: 'currencies', defaultMessage: 'Currencies' }),
      description: formatMessage({
        id: 'currency_config_description',
        defaultMessage: 'Set up currencies for pricing and payments',
      }),
      isRequired: true,
      setupUrl: '/currency/new',
      category: 'essential',
      estimatedTime: '2 min',
      icon: 'currency',
      isComplete: false,
    },
    countriesCount: {
      id: 'countries',
      title: formatMessage({ id: 'countries', defaultMessage: 'Countries' }),
      description: formatMessage({
        id: 'countries_config_description',
        defaultMessage: 'Configure countries and assign default currencies',
      }),
      isRequired: true,
      setupUrl: '/country/new',
      category: 'essential',
      estimatedTime: '2 min',
      icon: 'globe',
      isComplete: false,
    },
    languagesCount: {
      id: 'languages',
      title: formatMessage({ id: 'languages', defaultMessage: 'Languages' }),
      description: formatMessage({
        id: 'language_config_description',
        defaultMessage: 'Configure languages for content localization',
      }),
      isRequired: true,
      setupUrl: '/language/new',
      category: 'essential',
      estimatedTime: '2 min',
      icon: 'language',
      isComplete: false,
    },
    paymentProvidersCount: {
      id: 'payment',
      title: formatMessage({
        id: 'payment_processing',
        defaultMessage: 'Payment Processing',
      }),
      description: formatMessage({
        id: 'payment_processing_config_description',
        defaultMessage: 'Invoice payment provider is already configured',
      }),
      isRequired: true,
      setupUrl: '/payment-provider/new',
      category: 'commerce',
      estimatedTime: '10 min',
      icon: 'credit-card',
      isComplete: false,
    },
    deliveryProvidersCount: {
      id: 'delivery',
      title: formatMessage({
        id: 'delivery_processing',
        defaultMessage: 'Shipping & Delivery',
      }),
      description: formatMessage({
        id: 'delivery_processing_config_description',
        defaultMessage: 'Delivery methods are already configured',
      }),
      isRequired: true,
      setupUrl: '/delivery-provider/new',
      category: 'commerce',
      estimatedTime: '10 min',
      icon: 'truck',
      isComplete: false,
    },
    productsCount: {
      id: 'products',
      title: formatMessage({ id: 'products', defaultMessage: 'Products' }),
      description: formatMessage({
        id: 'products_config_description',
        defaultMessage: 'Create your first products',
      }),
      isRequired: true,
      setupUrl: '/products/new',
      category: 'content',
      estimatedTime: '5 min',
      icon: 'cube',
      isComplete: false,
    },
    assortmentsCount: {
      id: 'assortments',
      title: formatMessage({
        id: 'assortments',
        defaultMessage: 'Assortments',
      }),
      description: formatMessage({
        id: 'assortment_config_description',
        defaultMessage: 'Organize products into categories',
      }),
      isRequired: false,
      setupUrl: '/assortments/new',
      category: 'content',
      estimatedTime: '3 min',
      icon: 'folder',
      isComplete: false,
    },
  };
};

export default getSetupStepsConfigurationsMeta;
