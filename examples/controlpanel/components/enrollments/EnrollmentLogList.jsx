import { format } from 'date-fns';
import gql from 'graphql-tag';
import { graphql } from '@apollo/client/react/hoc';
import React from 'react';
import { Table, Label, Icon, Segment } from 'semantic-ui-react';
import Link from 'next/link';

const EnrollmentLogList = ({ data }) => {
  const logs = data?.enrollment?.logs || [];
  return (
    <Segment secondary>
      <Label horizontal attached="top">
        <Label.Detail>Logs</Label.Detail>
      </Label>
      <Table compact>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Date</Table.HeaderCell>
            <Table.HeaderCell>Message</Table.HeaderCell>
            <Table.HeaderCell>Context</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        {logs && (
          <Table.Body>
            {logs.map(({ _id, level, message, created, user }) => (
              <Table.Row key={_id}>
                <Table.Cell singleLine>{format(created, 'Pp')}</Table.Cell>
                <Table.Cell
                  warning={level === 'warn'}
                  error={level === 'error'}
                >
                  <code>{message}</code>
                </Table.Cell>
                <Table.Cell>
                  {user && (
                    <Link href={`/users/edit?_id=${user._id}`} passHref>
                      <Label horizontal basic>
                        <Icon name="user" /> {user.name.substr(0, 4)}
                        ...
                      </Label>
                    </Link>
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        )}
      </Table>
    </Segment>
  );
};

export default graphql(gql`
  query enrollmentLogs($enrollmentId: ID!) {
    enrollment(enrollmentId: $enrollmentId) {
      _id
      logs(offset: 0, limit: 0) {
        _id
        created
        level
        message
        user {
          _id
          name
        }
      }
    }
  }
`)(EnrollmentLogList);
