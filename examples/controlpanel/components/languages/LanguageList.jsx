import { compose, pure, withHandlers } from 'recompose';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import React from 'react';
import { Table, Icon, Button } from 'semantic-ui-react';
import Link from 'next/link';
import InfiniteDataTable, { withDataTableLoader } from '../InfiniteDataTable';

const LanguageList = ({ changeBaseLanguage, ...rest }) => (
  <InfiniteDataTable
    {...rest}
    cols={3}
    createPath="/languages/new"
    rowRenderer={(language) => (
      <Table.Row key={language._id}>
        <Table.Cell>
          <Link href={`/languages/edit?_id=${language._id}`}>
            <a href={`/languages/edit?_id=${language._id}`}>
              {language.isoCode}
            </a>
          </Link>
        </Table.Cell>
        <Table.Cell>
          {language.isActive && (
            <Icon color="green" name="checkmark" size="large" />
          )}
        </Table.Cell>
        <Table.Cell>
          {language.isBase ? (
            <b>Base language</b>
          ) : (
            <Button basic name={language._id} onClick={changeBaseLanguage}>
              Set as base language
            </Button>
          )}
        </Table.Cell>
      </Table.Row>
    )}
  >
    <Table.Row>
      <Table.HeaderCell>Name</Table.HeaderCell>
      <Table.HeaderCell>Activated?</Table.HeaderCell>
      <Table.HeaderCell />
    </Table.Row>
  </InfiniteDataTable>
);

export default compose(
  withDataTableLoader({
    queryName: 'languages',
    query: gql`
      query languages($offset: Int, $limit: Int) {
        languages(offset: $offset, limit: $limit, includeInactive: true) {
          _id
          isoCode
          isActive
          isBase
          name
        }
      }
    `,
  }),
  graphql(
    gql`
      mutation changeBaseLanguage($languageId: ID!) {
        setBaseLanguage(languageId: $languageId) {
          _id
          isBase
        }
      }
    `,
    {
      options: {
        refetchQueries: ['languages'],
      },
    }
  ),
  withHandlers({
    changeBaseLanguage: ({ mutate }) => (event, element) =>
      mutate({ variables: { languageId: element.name } }),
  }),
  pure
)(LanguageList);
