import React from 'react';
import { Card } from 'semantic-ui-react';
import CardProfileProgress from './CardProfileProgress';

export default () => (
  <Card.Group itemsPerRow={2} stackable>
    <CardProfileProgress />
  </Card.Group>
);
