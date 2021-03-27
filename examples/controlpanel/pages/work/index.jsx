import React, { useState } from 'react';
import { Container } from 'semantic-ui-react';

import App from '../../components/App';
import WorkList from '../../components/work/WorkList';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(({ ...rest }) => {
  const statusTypes = ['ALLOCATED', 'NEW', 'FAILED', 'SUCCESS'];
  const [workStatusFilter, setWorkStatusFilter] = useState([]);
  const [workTypeFilter, setWorkTypeFilter] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: new Date(),
  });

  const onFilterChange = ({ filterType, value }) => {
    if (filterType === 'workType') {
      setWorkTypeFilter(value);
    } else if (filterType === 'status') {
      setWorkStatusFilter(value);
    }
  };

  const onDateRangeChange = (date, value) => {
    if (date.toUpperCase() === 'START') {
      setDateRange({ ...dateRange, startDate: value });
    } else if (date.toUpperCase() === 'END') {
      setDateRange({ ...dateRange, endDate: value });
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
          {...dateRange}
        />
      </Container>
    </App>
  );
});
