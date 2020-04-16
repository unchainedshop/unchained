import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { format } from 'date-fns';
import React from 'react';
import { List, Segment, Menu, Dropdown, Label, Grid } from 'semantic-ui-react';
import BtnFinishWork from './BtnFinishWork';

const colorForStatus = (status) => {
  if (status === 'FAILED') return 'red';
  if (status === 'SUCCESS') return 'green';
  return 'orange';
};

const WorkHeader = ({ data }) => {
  const { work } = data;
  const {
    _id,
    status,
    created,
    scheduled,
    started,
    stopped,
    input,
    timeout,
    error,
    result,
    retries,
    priority,
    worker,
  } = work || {};
  const statusColor = colorForStatus(status);
  return (
    <>
      <Menu fluid attached="top" bworkless key="header-title">
        <Menu.Item header>{_id}</Menu.Item>
        <Menu.Item>
          <Label color={statusColor} horizontal>
            {status}
          </Label>
        </Menu.Item>
        <Menu.Menu position="right">
          <Dropdown item icon="wrench" simple>
            <Dropdown.Menu>
              <Dropdown.Header>Options</Dropdown.Header>
              <BtnFinishWork
                workId={_id}
                Component={Dropdown.Item}
                disabled={status !== 'ALLOCATED'}
              >
                Delete
              </BtnFinishWork>
            </Dropdown.Menu>
          </Dropdown>
        </Menu.Menu>
      </Menu>
      <Segment attached key="header-body">
        <Grid>
          <Grid.Row columns={2}>
            <Grid.Column width={10}>
              <List relaxed>
                <List.Item>
                  <List.Icon name="retry" />
                  <List.Content>Retries: {retries}</List.Content>
                </List.Item>
                <List.Item>
                  <List.Icon name="retry" />
                  <List.Content>Priority: {priority}</List.Content>
                </List.Item>
                <List.Item>
                  <List.Icon name="retry" />
                  <List.Content>Worker: {worker}</List.Content>
                </List.Item>
                {input && (
                  <List.Item>
                    <List.Icon name="input" />
                    <List.Content>{JSON.stringify(input)}</List.Content>
                  </List.Item>
                )}
                {error && (
                  <List.Item>
                    <List.Icon name="error" />
                    <List.Content>{JSON.stringify(error)}</List.Content>
                  </List.Item>
                )}
                {result && (
                  <List.Item>
                    <List.Icon name="result" />
                    <List.Content>{JSON.stringify(result)}</List.Content>
                  </List.Item>
                )}
              </List>
            </Grid.Column>
            <Grid.Column width={6}>
              <List>
                <List.Item>
                  <List.Icon name="add to calendar" />
                  <List.Content>
                    Created: {created ? format(created, 'Pp') : 'n/a'}
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Icon name="calendar" />
                  <List.Content>
                    Scheduled: {scheduled ? format(scheduled, 'Ppp') : 'n/a'}
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Icon name="hourglass start" />
                  <List.Content>
                    Started: {started ? format(started, 'Pp') : 'n/a'}
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Icon name="hourglass end" />
                  <List.Content>
                    Stopped: {stopped ? format(stopped, 'Pp') : 'n/a'}
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Icon name="ban" />
                  <List.Content>
                    Timeout: {timeout ? format(timeout, 'Ppp') : 'n/a'}
                  </List.Content>
                </List.Item>
              </List>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Segment>
    </>
  );
};

export default graphql(gql`
  query work($workId: ID!) {
    work(workId: $workId) {
      _id
      type
      scheduled
      status
      started
      stopped
      created
      deleted
      priority
      worker
      input
      result
      error
      retries
      timeout
    }
  }
`)(WorkHeader);
