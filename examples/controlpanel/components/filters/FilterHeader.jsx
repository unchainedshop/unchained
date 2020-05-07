import React from 'react';
import { compose, pure, mapProps } from 'recompose';
import { format } from 'date-fns';
import { Menu, Dropdown, Segment, List, Grid } from 'semantic-ui-react';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import BtnRemoveFilter from './BtnRemoveFilter';
import FormEditFilter from './FormEditFilter';

const FilterHeader = ({ loading, filter = {} }) => [
  <Menu fluid attached="top" borderless key="header-title">
    <Menu.Item header>
      Filter:&nbsp;
      {filter.texts && filter.texts.title}
    </Menu.Item>
    <Menu.Menu position="right">
      <Dropdown item icon="wrench" simple>
        <Dropdown.Menu>
          <Dropdown.Header>Options</Dropdown.Header>
          <BtnRemoveFilter filterId={filter._id} Component={Dropdown.Item}>
            Delete
          </BtnRemoveFilter>
        </Dropdown.Menu>
      </Dropdown>
    </Menu.Menu>
  </Menu>,
  <Segment attached loading={loading} key="header-body">
    <Grid>
      <Grid.Row columns={2}>
        <Grid.Column width={10}>
          <List>
            <List.Item>
              <List.Icon name="key" />
              <List.Content>Key: {filter.key}</List.Content>
            </List.Item>
            <List.Item>
              <List.Icon name="cube" />
              <List.Content>Filter type: {filter.__typename}</List.Content>
            </List.Item>
            <List.Item>
              <List.Icon name="add to calendar" />
              <List.Content>
                Created:{' '}
                {filter.created ? format(filter.created, 'Pp') : 'Unbekannt'}
              </List.Content>
            </List.Item>
            <List.Item>
              <List.Icon name="refresh" />
              <List.Content>
                Updated:{' '}
                {filter.updated ? format(filter.updated, 'Pp') : 'Unbekannt'}
              </List.Content>
            </List.Item>
          </List>
        </Grid.Column>
        <Grid.Column width={6}>
          <FormEditFilter filterId={filter._id} />
        </Grid.Column>
      </Grid.Row>
    </Grid>
  </Segment>,
];

export default compose(
  graphql(gql`
    query filterInfos($filterId: ID) {
      filter(filterId: $filterId) {
        _id
        key
        created
        updated
        type
        options {
          _id
          value
        }
        texts {
          _id
          title
        }
      }
    }
  `),
  mapProps(({ data: { filter, loading }, ...rest }) => ({
    filter,
    loading,
    ...rest,
  })),
  pure
)(FilterHeader);
