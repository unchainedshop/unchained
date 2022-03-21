import { compose, pure, mapProps } from 'recompose';
import { graphql } from '@apollo/client/react/hoc';
import React from 'react';
import { Dropdown } from 'semantic-ui-react';
import { SEARCH_WORK_TYPES } from '../searchQueries';

const WorkTypeSelector = ({ workTypes, onChange }) => {
  return (
    <Dropdown
      placeholder="Work types"
      onChange={onChange}
      fluid
      multiple
      search
      selection
      options={workTypes}
    />
  );
};

export default compose(
  graphql(SEARCH_WORK_TYPES, { options: { pollInterval: 10000 } }),
  mapProps(({ data: { activeWorkTypes }, error, loading, ...rest }) => ({
    workTypes: activeWorkTypes?.map((t) => ({
      key: t,
      value: t,
      text: t.toLowerCase(),
    })),
    error,
    loading,
    ...rest,
  })),
  pure,
)(WorkTypeSelector);
