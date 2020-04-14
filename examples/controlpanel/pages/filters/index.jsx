import React from 'react';
import { Container } from 'semantic-ui-react';
import App from '../../components/App';
import FilterList from '../../components/filters/FilterList';
import connectApollo from '../../lib/connectApollo';

export default connectApollo((props) => (
  <App {...props}>
    <Container>
      <h2>Filters</h2>
      <FilterList />
    </Container>
  </App>
));
