import { compose, pure, withProps, withHandlers } from 'recompose';
import Router from 'next/router';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import React from 'react';
import { Menu } from 'semantic-ui-react';

const ProductMenu = ({ menuItems, changeTab }) => (
  <Menu fluid vertical tabular>
    {menuItems && menuItems.map(({ isActive, name, description }) => (
      <Menu.Item
        key={name}
        active={isActive}
        name={name}
        onClick={changeTab}
      >
        {description}
      </Menu.Item>
    ))}
  </Menu>
);

export const PRODUCT_TYPE_NAME_QUERY = gql`
  query productTypeName($productId: ID) {
    product(productId: $productId) {
      _id
      __typename
    }
  }
`;

export const PRODUCT_INTERFACES_QUERY = gql`
  query productInterfaces($typeName: String!) {
    __type(name: $typeName) {
      interfaces {
        name
        description
      }
    }
  }
`;

export default compose(
  graphql(PRODUCT_TYPE_NAME_QUERY),
  withProps(({ data: { product = {} } = {} }) => ({
    typeName: (product && product.__typename) || '', // eslint-disable-line
  })),
  graphql(PRODUCT_INTERFACES_QUERY),
  withProps(({ url, data: { __type } = {} }) => { // eslint-disable-line
    const menuItems = [];
    ((__type && __type.interfaces) || []).forEach((concreteInterface, key) => {
      if (key !== 0) {
        menuItems.push({
          name: concreteInterface.name,
          description: concreteInterface.description,
          isActive: (
            url.query.tab === concreteInterface.name
          ) || (
            (!url.query.tab || url.query.tab === '') && key === 1
          ),
        });
      }
    });
    return {
      menuItems,
    };
  }),
  withHandlers({
    changeTab: ({ url }) => (event, element) => {
      const newUrl = url;
      newUrl.query.tab = element.name;
      Router.replace(newUrl);
    },
  }),
  pure,
)(ProductMenu);
