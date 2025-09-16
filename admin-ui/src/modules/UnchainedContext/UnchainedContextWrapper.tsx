import React, { useMemo } from 'react';

import { gql } from '@apollo/client';
import UnchainedContext from './UnchainedContext';
import useShopInfo from '../common/hooks/useShopInfo';

const assignObjectValue = (object1, object2) => {
  const result = {};
  const keys = Object.keys(object2);
  keys.forEach((key) => {
    const value1 = object1?.[key];
    const value2 = object2?.[key];
    if (typeof value2 === 'object') {
      result[key] = assignObjectValue(value1, value2);
    } else {
      result[key] = value1;
    }
  });
  return result;
};

const getKeyValuePair = (selectionSet) => {
  return selectionSet.reduce((acc, selection) => {
    switch (selection.kind) {
      case 'InlineFragment': {
        const pairs = getKeyValuePair(selection.selectionSet.selections);
        Object.assign(acc, pairs);
        break;
      }
      case 'Field': {
        const key = selection.name.value;
        let value;
        if (selection.selectionSet) {
          value = getKeyValuePair(selection.selectionSet.selections);
        } else {
          value = selection.value;
        }
        acc[key] = value;
        break;
      }
      default: {
        break;
      }
    }
    return acc;
  }, {});
};

const hydrateFragment = (fragment, source) => {
  if (!fragment || !source) return null;
  const queryFragment = gql`fragment CustomProperty on ExtendedUnchainedSchema { ${fragment}  }`;
  const fragmentKeys = getKeyValuePair(
    (queryFragment?.definitions[0] as any)?.selectionSet?.selections,
  );
  return assignObjectValue(source, fragmentKeys);
};

const UnchainedContextWrapper = ({ children }) => {
  const { shopInfo } = useShopInfo();

  return (
    <UnchainedContext.Provider
      value={useMemo(() => {
        const customProperties =
          shopInfo?.adminUiConfig?.customProperties?.reduce(
            (prev, { entityName, inlineFragment }) => ({
              ...prev,
              [entityName]: inlineFragment,
            }),
            {},
          );
        return {
          customProperties,
          singleSignOnURL: shopInfo?.adminUiConfig?.singleSignOnURL,
          hydrateFragment,
        };
      }, [shopInfo])}
    >
      {children}
    </UnchainedContext.Provider>
  );
};

export default UnchainedContextWrapper;
