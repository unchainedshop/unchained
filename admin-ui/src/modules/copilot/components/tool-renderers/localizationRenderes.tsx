import copilotCount from '../copilotCount';
import CopilotCountryList, { CountryItemCompact } from '../CopilotCountryList';
import CopilotCurrencyList, {
  CurrencyItemCompact,
} from '../CopilotCurrencyList';
import CopilotLanguageList, {
  LanguageItemCompact,
} from '../CopilotLanguageList';
import OperationStatusIndicator from '../OperationStatusIndicator';
import { createActionMappings } from './shared/createRenderer';

const SHARED_ACTIONS = ['CREATE', 'UPDATE', 'GET'];

const localizationDisplayMap = {
  COUNTRY: {
    ...createActionMappings(SHARED_ACTIONS, CountryItemCompact),
    LIST: CopilotCountryList,
    COUNT: copilotCount('COUNTRY'),
    REMOVE: OperationStatusIndicator,
  },
  CURRENCY: {
    ...createActionMappings(SHARED_ACTIONS, CurrencyItemCompact),
    LIST: CopilotCurrencyList,
    COUNT: copilotCount('CURRENCY'),
    REMOVE: OperationStatusIndicator,
  },
  LANGUAGE: {
    ...createActionMappings(SHARED_ACTIONS, LanguageItemCompact),
    LIST: CopilotLanguageList,
    COUNT: copilotCount('LANGUAGE'),
    REMOVE: OperationStatusIndicator,
  },
};

export const renderLocalizationToolResponses = ({
  localizationType,
  action,
  data,
  ...rest
}) => {
  const Component = localizationDisplayMap?.[localizationType]?.[action];
  return Component ? (
    <Component type={localizationType} {...data} {...rest} />
  ) : null;
};
