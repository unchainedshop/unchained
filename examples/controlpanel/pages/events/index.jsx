import React, { useState } from 'react';
import { Container } from 'semantic-ui-react';

import App from '../../components/App';
import EventList from '../../components/event/EventList';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(({ ...rest }) => {
  const [workTypeFilter, setWorkTypeFilter] = useState([]);

  const onFilterChange = ({ filterType, value }) => {
    if (filterType === 'workType') {
      setWorkTypeFilter(value);
    }
  };

  return (
    <App {...rest}>
      <Container>
        <h2>Events</h2>
        <EventList
          queryOptions={{ pollInterval: 2000 }}
          limit={10}
          types={workTypeFilter}
          onFilterChange={onFilterChange}
        />
      </Container>
    </App>
  );
});
