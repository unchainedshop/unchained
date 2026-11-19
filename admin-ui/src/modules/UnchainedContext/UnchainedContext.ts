import React from 'react';

const UnchainedContext = React.createContext<{
  customProperties: Record<string, string>;
  singleSignOnURL?: string;
  loginCodeEnabled?: boolean;
  hydrateFragment: Function;
}>({
  customProperties: {},

  hydrateFragment: (fragment: string, data: any) => null,
});

export default UnchainedContext;
