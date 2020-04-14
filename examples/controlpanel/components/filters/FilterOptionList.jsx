import React from 'react';
import { compose, pure, mapProps } from 'recompose';
import { Segment, List } from 'semantic-ui-react';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import FilterOptionListItem from './FilterOptionListItem';
import FormNewFilterOption from './FormNewFilterOption';

// import FilterVariationOptionItem from './FilterVariationOptionItem';
// import FormNewFilterVariation from './FormNewFilterVariation';
// import FormNewFilterVariationOption from './FormNewProductVariationOption';

const FilterVariationList = ({ items, filterId }) => (
  <Segment>
    <List celled>
      {items.map(({ options, key, ...item }) => (
        <FilterOptionListItem
          filterId={filterId}
          key={item._id}
          name={key}
          {...item}
        />
      ))}
      <List.Item>
        <FormNewFilterOption filterId={filterId} onSuccess={() => true} />
      </List.Item>
    </List>
  </Segment>
);

export default compose(
  graphql(gql`
    query filterOptions($filterId: ID) {
      filter(filterId: $filterId) {
        _id
        options {
          _id
          value
          texts {
            _id
            title
            subtitle
          }
        }
      }
    }
  `),
  mapProps(({ data: { filter }, ...rest }) => ({
    items: (filter && filter.options) || [],
    pressDelay: 200,
    ...rest,
  })),
  pure
)(FilterVariationList);
