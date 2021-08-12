import { compose } from 'recompose';
import gql from 'graphql-tag';
import Link from 'next/link';
import { graphql } from '@apollo/client/react/hoc';
import { format } from 'date-fns';
import React from 'react';
import {
  List,
  Segment,
  Menu,
  Dropdown,
  Label,
  Icon,
  Grid,
} from 'semantic-ui-react';
import Address from '../Address';

const colorForStatus = (status) => {
  if (status === 'INITIAL') return 'red';
  if (status === 'ACTIVE') return 'green';
  return 'orange';
};

const EnrollmentHeader = ({ data, loading, terminateEnrollment }) => {
  const {
    _id,
    status,
    created,
    expires,
    enrollmentNumber,
    country,
    updated,
    contact,
    currency,
    billingAddress,
    user,
  } = data.enrollment || {};

  const statusColor = colorForStatus(status);

  if (!_id) return null;

  return (
    <>
      <Menu fluid attached="top" benrollmentless key="header-title">
        <Menu.Item header>
          Enrollment {enrollmentNumber || ''}
          &nbsp;
          <small>({_id})</small>
        </Menu.Item>
        <Menu.Item>
          <Label color={statusColor} horizontal>
            {status}
          </Label>
        </Menu.Item>
        <Menu.Menu position="right">
          <Dropdown item icon="wrench" simple>
            <Dropdown.Menu>
              <Dropdown.Header>Options</Dropdown.Header>
              <Dropdown.Item
                primary
                fluid
                disabled={status !== 'ACTIVE'}
                onClick={terminateEnrollment}
              >
                Terminate
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Menu.Menu>
      </Menu>
      ,
      <Segment attached key="header-body" loading={loading}>
        <Grid>
          <Grid.Row columns={2}>
            <Grid.Column width={10}>
              <List relaxed>
                <List.Item>
                  <List.Icon name="money" />
                  <List.Content>
                    Currency: {currency && currency.isoCode}
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Icon name="world" />
                  <List.Content>
                    Shop:{' '}
                    {country && `${country.flagEmoji} (${country.isoCode})`}
                  </List.Content>
                </List.Item>
                {user && (
                  <List.Item>
                    <List.Icon name="user" />
                    <List.Content>
                      User:&nbsp;
                      <Link href={`/users/edit?_id=${user._id}`}>
                        <a href={`/users/edit?_id=${user._id}`}>
                          {`${user.name || user._id}`}
                        </a>
                      </Link>
                    </List.Content>
                  </List.Item>
                )}
                {contact && (
                  <List.Item>
                    <List.Icon name="mail" />
                    <List.Content>
                      E-Mail:
                      {`${contact.emailAddress}`}
                    </List.Content>
                  </List.Item>
                )}
                <List.Item>
                  <Label horizontal basic>
                    <Icon name="mail" />
                    Invoice Address
                  </Label>
                  <Address {...billingAddress} />
                </List.Item>
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
                    Updated: {updated ? format(updated, 'Pp') : 'n/a'}
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Icon name="plus cart" />
                  <List.Content>
                    Expires: {expires ? format(expires, 'Pp') : 'n/a'}
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

export default compose(
  graphql(
    gql`
      mutation terminateEnrollment($enrollmentId: ID!) {
        terminateEnrollment(enrollmentId: $enrollmentId) {
          _id
          status
          expires
        }
      }
    `,
    {
      name: 'terminateEnrollment',
      options: {
        refetchQueries: ['enrollment', 'enrollments'],
      },
    }
  ),
  graphql(gql`
    query enrollment($enrollmentId: ID!) {
      enrollment(enrollmentId: $enrollmentId) {
        _id
        enrollmentNumber
        status
        created
        updated
        expires
        user {
          _id
          name
        }
        contact {
          emailAddress
        }
        currency {
          _id
          isoCode
        }
        country {
          _id
          isoCode
          flagEmoji
        }
        billingAddress {
          firstName
          lastName
          company
          postalCode
          countryCode
          regionCode
          city
          addressLine
          addressLine2
        }
      }
    }
  `)
)(EnrollmentHeader);
