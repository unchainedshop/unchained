import CopilotProviderInterfaceList from '../CopilotProviderInterfaceList';
import CopilotProviderList, {
  CopilotProviderListItem,
} from '../CopilotProviderList';
import { createActionMappings, mergeMappings } from './shared/createRenderer';

const SINGLE_PROVIDER_ACTIONS = ['CREATE', 'UPDATE', 'REMOVE', 'GET'];

const providerDisplayMap = mergeMappings(
  ...['PAYMENT', 'DELIVERY', 'WAREHOUSING'].map((providerType) => {
    const baseMap = createActionMappings(
      SINGLE_PROVIDER_ACTIONS,
      CopilotProviderListItem,
    );
    const additionalMappings = {
      LIST: CopilotProviderList,
      INTERFACES: CopilotProviderInterfaceList,
    };
    return Object.fromEntries(
      Object.entries({ ...baseMap, ...additionalMappings }).map(
        ([action, component]) => [`${providerType}_${action}`, component],
      ),
    );
  }),
);

export const renderProvidersToolResponses = ({
  providerType,
  action,
  data,
}) => {
  const key = `${providerType}_${action}`;
  const Component = providerDisplayMap[key];
  return Component ? <Component type={providerType} {...data} /> : null;
};
