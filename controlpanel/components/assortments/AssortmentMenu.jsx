import React from 'react';
import {
  compose, pure, withProps, withHandlers,
} from 'recompose';
import { withRouter } from 'next/router';
import { Menu } from 'semantic-ui-react';

const AssortmentMenu = ({ menuItems, changeTab }) => (
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

export default compose(
  withRouter,
  withProps(({ router }) => { // eslint-disable-line
    const menuItems = [{
      name: 'AssortmentTranslation',
      description: 'Texts',
      isActive: (
        router.query.tab === ''
      ) || (
        (!router.query.tab || router.query.tab === 'AssortmentTranslation')
      ),
    }, {
      name: 'AssortmentLinks',
      description: 'Links',
      isActive: (router.query && router.query.tab === 'AssortmentLinks'),
    }, {
      name: 'AssortmentProducts',
      description: 'Products',
      isActive: (router.query && router.query.tab === 'AssortmentProducts'),
    }, {
      name: 'AssortmentFilters',
      description: 'Filters',
      isActive: (router.query && router.query.tab === 'AssortmentFilters'),
    }];
    return {
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
  pure,
)(AssortmentMenu);
