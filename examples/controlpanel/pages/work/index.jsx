import React, { useState } from 'react';
import { Container } from 'semantic-ui-react';

import App from '../../components/App';
import WorkList from '../../components/work/WorkList';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(({ ...rest }) => {
  const statusTypes = ['ALLOCATED', 'NEW', 'FAILED', 'SUCCESS'];
  const [workStatusFilter, setWorkStatusFilter] = useState([]);
  const [workTypeFilter, setWorkTypeFilter] = useState([]);

  const onFilterChange = ({ filterType, value }) => {
    if (filterType === 'workType') {
      setWorkTypeFilter(value);
    } else if (filterType === 'status') {
      setWorkStatusFilter(value);
    }
  };

  return (
    <App {...rest}>
      <Container>
        <h2>Work Queue</h2>
        <WorkList
          queryOptions={{ pollInterval: 2000 }}
          limit={0}
          status={workStatusFilter}
          selectTypes={workTypeFilter}
          statusTypes={statusTypes}
          onFilterChange={onFilterChange}
        />
      </Container>
    </App>
  );
});
