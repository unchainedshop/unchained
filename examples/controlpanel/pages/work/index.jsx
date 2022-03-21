import React, { useState } from 'react';
import { Container } from 'semantic-ui-react';

import App from '../../components/App';
import WorkList from '../../components/work/WorkList';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(({ ...rest }) => {
  const statusTypes = ['ALLOCATED', 'NEW', 'FAILED', 'SUCCESS'];
  const [workStatusFilter, setWorkStatusFilter] = useState();
  const [workTypeFilter, setWorkTypeFilter] = useState();
  const [dateRange, setDateRange] = useState({
    start: new Date(0),
    end: null,
  });

  const onFilterChange = ({ filterType, value }) => {
    if (filterType === 'workType') {
      setWorkTypeFilter(value?.length ? value : undefined);
    } else if (filterType === 'status') {
      setWorkStatusFilter(value?.length ? value : undefined);
    }
  };

  const onDateRangeChange = (date, value) => {
    if (date.toUpperCase() === 'START') {
      setDateRange({ ...dateRange, start: value });
    } else if (date.toUpperCase() === 'END') {
      setDateRange({ ...dateRange, end: value });
    }
  };

  return (
    <App {...rest}>
      <Container>
        <h2>Work Queue</h2>
        <WorkList
          queryOptions={{ pollInterval: 2000 }}
          limit={10}
          selectTypes={workTypeFilter}
          status={workStatusFilter}
          statusTypes={statusTypes}
          onFilterChange={onFilterChange}
          onDateRangeChange={onDateRangeChange}
          created={dateRange}
        />
      </Container>
    </App>
  );
});
