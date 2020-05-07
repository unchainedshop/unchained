import { compose, pure, withProps, withHandlers } from 'recompose';
import { withRouter } from 'next/router';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import React from 'react';
import { Menu } from 'semantic-ui-react';

const ProductMenu = ({ menuItems, changeTab }) => (
  <Menu fluid vertical tabular>
    {menuItems &&
      menuItems.map(({ isActive, name, description }) => (
        <Menu.Item key={name} active={isActive} name={name} onClick={changeTab}>
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

export default compose(
  withRouter,
  graphql(PRODUCT_TYPE_NAME_QUERY),
  withProps(({ router, data: { product = {} } = {} }) => {
    const menuItems = [
      {
        name: 'ProductTranslation',
        description: 'General Texts',
        isActive:
          router.query.tab === 'ProductTranslation' ||
          !router.query.tab ||
          router.query.tab === '',
      },
    ];

    if (product.__typename === 'SimpleProduct') {
      menuItems.push({
        name: 'ProductVisualization',
        description: 'Media',
        isActive: router.query.tab === 'ProductVisualization',
      });
      menuItems.push({
        name: 'ProductCommerce',
        description: 'Commerce',
        isActive: router.query.tab === 'ProductCommerce',
      });
      menuItems.push({
        name: 'ProductSupply',
        description: 'Supply',
        isActive: router.query.tab === 'ProductSupply',
      });
      menuItems.push({
        name: 'ProductWarehousing',
        description: 'Warehousing',
        isActive: router.query.tab === 'ProductWarehousing',
      });
    }

    if (product.__typename === 'ConfigurableProduct') {
      menuItems.push({
        name: 'ProductVisualization',
        description: 'Media',
        isActive: router.query.tab === 'ProductVisualization',
      });
      menuItems.push({
        name: 'ProductCommerce',
        description: 'Commerce',
        isActive: router.query.tab === 'ProductCommerce',
      });
      menuItems.push({
        name: 'ProductProxy',
        description: 'Variations',
        isActive: router.query.tab === 'ProductProxy',
      });
    }

    if (product.__typename === 'BundleProduct') {
      menuItems.push({
        name: 'ProductVisualization',
        description: 'Media',
        isActive: router.query.tab === 'ProductVisualization',
      });
      menuItems.push({
        name: 'ProductCommerce',
        description: 'Commerce',
        isActive: router.query.tab === 'ProductCommerce',
      });
      menuItems.push({
        name: 'ProductBundleItems',
        description: 'Bundled products',
        isActive: router.query.tab === 'ProductBundleItems',
      });
    }

    if (product.__typename === 'PlanProduct') {
      menuItems.push({
        name: 'ProductVisualization',
        description: 'Media',
        isActive: router.query.tab === 'ProductVisualization',
      });
      menuItems.push({
        name: 'ProductCommerce',
        description: 'Commerce',
        isActive: router.query.tab === 'ProductCommerce',
      });
      menuItems.push({
        name: 'ProductPlan',
        description: 'Subscription',
        isActive: router.query.tab === 'ProductPlan',
      });
    }
    return {
      typeName: (product && product.__typename) || '',
      menuItems,
    };
  }),
  withHandlers({
    changeTab: ({ router }) => (event, element) => {
      router.replace({
        pathname: router.pathname,
        query: {
          ...router.query,
          tab: element.name,
        },
      });
    },
  }),
  pure
)(ProductMenu);
