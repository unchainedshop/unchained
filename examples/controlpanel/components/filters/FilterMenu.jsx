import React from 'react';
import { compose, pure, withProps, withHandlers } from 'recompose';
import { withRouter } from 'next/router';
import { Menu } from 'semantic-ui-react';

const FilterMenu = ({ menuItems, changeTab }) => (
  <Menu fluid vertical tabular>
    {menuItems &&
      menuItems.map(({ isActive, name, description }) => (
        <Menu.Item key={name} active={isActive} name={name} onClick={changeTab}>
          {description}
        </Menu.Item>
      ))}
  </Menu>
);

export default compose(
  withRouter,
  withProps(({ router }) => {
    const menuItems = [
      {
        name: 'FilterTranslation',
        description: 'Texts',
        isActive:
          router.query.tab === '' || !router.query.tab || router.query.tab === 'FilterTranslation',
      },
      {
        name: 'FilterOptions',
        description: 'Options',
        isActive: router.query && router.query.tab === 'FilterOptions',
      },
    ];
    return {
      menuItems,
    };
  }),
  withHandlers({
    changeTab:
      ({ router }) =>
      (event, element) => {
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
)(FilterMenu);
