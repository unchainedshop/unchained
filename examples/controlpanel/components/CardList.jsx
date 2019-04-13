import React from 'react';
import { Card } from 'semantic-ui-react';
import CardOrdersThisWeek from './CardOrdersThisWeek';

export default () => (
  <Card.Group itemsPerRow={2} stackable>
    <CardOrdersThisWeek />
  </Card.Group>
);
