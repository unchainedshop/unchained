import React from 'react';
import { Container, Tab } from 'semantic-ui-react';
import App from '../../components/App';
import AssortmentList from '../../components/assortments/AssortmentList';
import AssortmentGraph from '../../components/assortments/AssortmentGraph';

import connectApollo from '../../lib/connectApollo';


const panes = [
  {
    menuItem: 'List',
    render: () => (
      <Tab.Pane>
        <AssortmentList />
      </Tab.Pane>
    ),
  },
  {
    menuItem: 'Graph',
    render: () => (
      <Tab.Pane>
        <AssortmentGraph />
      </Tab.Pane>
    ),
  },
];

export default connectApollo(props => (
  <App {...props}>
    <Container>
      <h2>
Assortments
      </h2>
      <Tab panes={panes} />
    </Container>
  </App>
));
