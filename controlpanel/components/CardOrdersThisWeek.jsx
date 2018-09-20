import React from 'react';
import { Card } from 'semantic-ui-react';
import { compose, pure } from 'recompose';

const CardOrdersThisWeek = () => (
  <Card color="black" raised>
    <Card.Content>
      <Card.Header>
        Orders this Week
      </Card.Header>
      <Card.Description>
        n/a
      </Card.Description>
    </Card.Content>
  </Card>
);

export default compose(
  pure,
)(CardOrdersThisWeek);
