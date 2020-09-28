import React from 'react';
import { compose, mapProps } from 'recompose';
import { format } from 'date-fns';
import { Menu, Dropdown, Segment, List, Grid } from 'semantic-ui-react';
import gql from 'graphql-tag';
import { graphql } from '@apollo/client/react/hoc';
import BtnRemoveAssortment from './BtnRemoveAssortment';
import FormEditAssortment from './FormEditAssortment';
import BreadcrumbTrail from '../BreadcrumbTrail';

const AssortmentHeader = ({ loading, assortmentId, assortment = {} }) => {
  return [
    assortment && assortment.assortmentPaths && (
      <BreadcrumbTrail assortmentPaths={assortment.assortmentPaths} />
    ),
    <Menu fluid attached="top" borderless key="header-title">
      <Menu.Item header>
        Assortment:
        {assortment.texts?.title}
      </Menu.Item>
      <Menu.Menu position="right">
        <Dropdown item icon="wrench" simple>
          <Dropdown.Menu>
            <Dropdown.Header>Options</Dropdown.Header>
            <BtnRemoveAssortment
              assortmentId={assortment._id}
              Component={Dropdown.Item}
            >
              Delete
            </BtnRemoveAssortment>
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
                <List.Icon name="add to calendar" />
                <List.Content>
                  Created:{' '}
                  {assortment.created
                    ? format(assortment.created, 'Pp')
                    : 'Unbekannt'}
                </List.Content>
              </List.Item>
              <List.Item>
                <List.Icon name="refresh" />
                <List.Content>
                  Updated:
                  {assortment.updated
                    ? format(assortment.updated, 'Pp')
                    : 'Unbekannt'}
                </List.Content>
              </List.Item>
            </List>
          </Grid.Column>
          <Grid.Column width={6}>
            <FormEditAssortment assortmentId={assortmentId} />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Segment>,
  ];
};

export default compose(
  graphql(gql`
    query assortmentInfos($assortmentId: ID) {
      assortment(assortmentId: $assortmentId) {
        _id
        created
        assortmentPaths {
          links {
            link {
              tags
            }
            assortmentId
            assortmentTexts {
              title
            }
          }
        }
        updated
        texts {
          _id
          title
        }
      }
    }
  `),
  mapProps(({ data: { assortment, loading }, ...rest }) => ({
    assortment,
    loading,
    ...rest,
  }))
)(AssortmentHeader);
