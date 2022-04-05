import gql from 'graphql-tag';
import { graphql } from '@apollo/client/react/hoc';
import React from 'react';
import { List, Segment, Menu, Grid } from 'semantic-ui-react';

const EventHeader = ({ data }) => {
  const { event } = data;
  const { _id, created, type, payload } = event || {};
  return (
    <>
      <Menu fluid attached="top" bworkless key="header-title">
        <Menu.Item header>{_id}</Menu.Item>
      </Menu>
      <Segment attached key="header-body">
        <Grid divided="vertically">
          <Grid.Row columns={2}>
            <Grid.Column width={6}>
              <List>
                <List.Item>
                  <List.Content>
                    Created: {created ? new Date(created).toLocaleString() : 'n/a'}
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Content>Type: {type}</List.Content>
                </List.Item>
              </List>
            </Grid.Column>
          </Grid.Row>
        </Grid>
        <textarea
          readOnly
          cols={10}
          style={{
            width: '50%',
            minHeight: '30rem',
            fontFamily: '"Lucida Console", Monaco, monospace',
            fontSize: '0.8rem',
            lineHeight: 1.2,
            resize: 'none',
          }}
          defaultValue={JSON.stringify(payload, undefined, 4)}
        />
      </Segment>
    </>
  );
};

export default graphql(gql`
  query Event($eventId: ID!) {
    event(eventId: $eventId) {
      _id
      type
      created
      payload
    }
  }
`)(EventHeader);
