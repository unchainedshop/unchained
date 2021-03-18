import gql from 'graphql-tag';
import { graphql } from '@apollo/client/react/hoc';
import React from 'react';
import {
  List,
  Segment,
  Menu,
  Dropdown,
  Grid,
} from 'semantic-ui-react';


const EventHeader = ({ data }) => {
  const { event } = data;
  const {
    _id,
    created,
    type,
    payload
  } = event || {};
  return (
    <>
      <Menu fluid attached="top" bworkless key="header-title">
        <Menu.Item header>{_id}</Menu.Item>
        <Menu.Menu position="right">
          <Dropdown item icon="wrench" simple>
            <Dropdown.Menu>
              <Dropdown.Header>Options</Dropdown.Header>
            </Dropdown.Menu>
          </Dropdown>
        </Menu.Menu>
      </Menu>
      <Segment attached key="header-body">
        <Grid divided="vertically">
          <Grid.Row columns={2}>
            <Grid.Column width={6}>
              <List>
                <List.Item>
                  <List.Content>
                    Created:{' '}
                    {created ? new Date(created).toLocaleString() : 'n/a'}
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Content>
                    Type:{' '}
                    {type}
                  </List.Content>
                </List.Item>
              </List>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Segment>
      <code> {JSON.stringify(payload)} </code>
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
