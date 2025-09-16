import { useMemo } from 'react';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useIntl } from 'react-intl';
import getSetupStepsConfigurationsMeta, {
  ConfigurationStep,
  ShopConfiguration,
} from '../utils/getSetupStepsConfigurationsMeta';
import useFormatDateTime from '../utils/useFormatDateTime';

const BASIC_SHOP_STATUS_QUERY = gql`
  query ShopStatus {
    countriesCount
    currenciesCount
    languagesCount
    productsCount
    assortmentsCount
    filtersCount
    deliveryProvidersCount
    paymentProvidersCount
  }
`;

const buildConfiguration = (steps: ConfigurationStep): ShopConfiguration => {
  const entries = Object.values(steps);

  const completedSteps = entries.filter((step) => step.isComplete);
  const requiredSteps = entries.filter((step) => step.isRequired);
  const completedRequiredSteps = requiredSteps.filter(
    (step) => step.isComplete,
  );

  const essentialSteps = entries.filter(
    (step) => step.category === 'essential',
  );
  const commerceSteps = entries.filter((step) => step.category === 'commerce');
  const contentSteps = entries.filter((step) => step.category === 'content');

  return {
    steps,
    completedSteps,
    overallProgress: Math.round((completedSteps.length / entries.length) * 100),
    isFullyConfigured: completedRequiredSteps.length === requiredSteps.length,
    essentialStepsComplete: essentialSteps.every((step) => step.isComplete),
    commerceStepsComplete: commerceSteps
      .filter((step) => step.isRequired)
      .every((step) => step.isComplete),
    contentStepsComplete: contentSteps.every((step) => step.isComplete),
    essentialSteps,
    commerceSteps,
    contentSteps,
  };
};

const useShopConfiguration = () => {
  const { formatMessage } = useIntl();
  const { data, loading, error } = useQuery(BASIC_SHOP_STATUS_QUERY);

  const configuration = useMemo(() => {
    const configurationSeptsMeta =
      getSetupStepsConfigurationsMeta(formatMessage);
    const updatedSteps = { ...configurationSeptsMeta };

    if (data) {
      for (const key of Object.keys(updatedSteps)) {
        updatedSteps[key] = {
          ...updatedSteps[key],
          isComplete: Boolean(data?.[key] > 0),
        };
      }
    }

    return buildConfiguration(updatedSteps);
  }, [data]);

  return {
    configuration,
    loading,
    error,
  };
};

export default useShopConfiguration;
