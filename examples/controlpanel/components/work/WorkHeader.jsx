import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import Link from 'next/link';
import React from 'react';
import {
  List,
  Segment,
  Menu,
  Dropdown,
  Label,
  Grid,
  Header,
} from 'semantic-ui-react';
import dynamic from 'next/dynamic';

import BtnRemoveWork from './BtnRemoveWork';

const ReactJson = dynamic(import('@ggascoigne/react-json-view'), {
  ssr: false,
});

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
    deleted,
    original,
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
              <BtnRemoveWork
                workId={_id}
                Component={Dropdown.Item}
                disabled={status === 'FAILED' || status === 'SUCCESS'}
              >
                Delete
              </BtnRemoveWork>
            </Dropdown.Menu>
          </Dropdown>
        </Menu.Menu>
      </Menu>
      <Segment attached key="header-body">
        <Grid divided="vertically">
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
                <List.Item>
                  <List.Icon name="retry" />
                  <List.Content>
                    Original:&nbsp;
                    <Link href={`/work/view?_id=${original}`}>
                      <a href={`/work/view?_id=${original}`}>{original}</a>
                    </Link>
                  </List.Content>
                </List.Item>
              </List>
            </Grid.Column>
            <Grid.Column width={6}>
              <List>
                <List.Item>
                  <List.Icon name="add to calendar" />
                  <List.Content>
                    Created:{' '}
                    {created ? new Date(created).toLocaleString() : 'n/a'}
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Icon name="calendar" />
                  <List.Content>
                    Scheduled:{' '}
                    {scheduled ? new Date(scheduled).toLocaleString() : 'n/a'}
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Icon name="hourglass start" />
                  <List.Content>
                    Started:{' '}
                    {started ? new Date(started).toLocaleString() : 'n/a'}
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Icon name="hourglass end" />
                  <List.Content>
                    Stopped:{' '}
                    {stopped ? new Date(stopped).toLocaleString() : 'n/a'}
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Icon name="ban" />
                  <List.Content>
                    Timeout:{' '}
                    {timeout ? new Date(timeout).toLocaleString() : 'n/a'}
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Icon name="ban" />
                  <List.Content>
                    Deleted:{' '}
                    {deleted ? new Date(deleted).toLocaleString() : 'n/a'}
                  </List.Content>
                </List.Item>
              </List>
            </Grid.Column>
          </Grid.Row>
          {input && (
            <Grid.Row secondary columns={1}>
              <Grid.Column width={16}>
                <Header size="small">Input</Header>
                <ReactJson src={input || {}} />
              </Grid.Column>
            </Grid.Row>
          )}
          {error && (
            <Grid.Row secondary columns={1}>
              <Grid.Column width={16}>
                <Header size="small">Error</Header>
                <ReactJson src={error || {}} />
              </Grid.Column>
            </Grid.Row>
          )}
          {result && (
            <Grid.Row secondary columns={1}>
              <Grid.Column width={16}>
                <Header size="small">Result</Header>
                <ReactJson src={result || {}} />
              </Grid.Column>
            </Grid.Row>
          )}
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
      original
      timeout
    }
  }
`)(WorkHeader);
