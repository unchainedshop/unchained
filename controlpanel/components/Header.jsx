import React from 'react';
import { withApollo } from 'react-apollo';
import Link from 'next/link';
import { Menu, Dropdown } from 'semantic-ui-react';
import { compose, pure, withHandlers, mapProps } from 'recompose';
import { logout } from '../lib/accounts';

const MenuLayout = ({ pathname, children, loading, ...rest }) => (
  <Menu color="red" attached="top" size="tiny" {...rest}>
    <Link href="/" passHref>
      <Menu.Item active={pathname === '/'}>
        <img src="/static/diamond-snake-colored.jpg" alt="unchained logo" />
      </Menu.Item>
    </Link>
    {!loading && children}
  </Menu>
);

const Header = ({ pathname, loggedInUser, logout: doLogout, ...rest }) =>
  loggedInUser ? (
    <MenuLayout pathname={pathname} {...rest}>
      <Link href="/users" passHref>
        <Menu.Item active={pathname.startsWith('/users')}>
          <span>Users</span>
        </Menu.Item>
      </Link>
      <Link href="/products" passHref>
        <Menu.Item active={pathname.startsWith('/products')}>
          <span>Products</span>
        </Menu.Item>
      </Link>
      <Link href="/assortments" passHref>
        <Menu.Item active={pathname.startsWith('/assortments')}>
          <span>Assortments</span>
        </Menu.Item>
      </Link>
      <Link href="/filters" passHref>
        <Menu.Item active={pathname.startsWith('/filters')}>
          <span>Filters</span>
        </Menu.Item>
      </Link>
      <Link href="/quotations" passHref>
        <Menu.Item active={pathname.startsWith('/quotations')}>
          <span>Quotations</span>
        </Menu.Item>
      </Link>
      <Link href="/orders" passHref>
        <Menu.Item active={pathname.startsWith('/orders')}>
          <span>Orders</span>
        </Menu.Item>
      </Link>
      <Link href="/logs" passHref>
        <Menu.Item active={pathname.startsWith('/logs')}>
          <span>Logs</span>
        </Menu.Item>
      </Link>
      <Menu.Menu position="right">
        <Dropdown item icon="settings">
          <Dropdown.Menu>
            <Link href="/countries" passHref>
              <Dropdown.Item active={pathname === '/countries'}>
                <span>Countries</span>
              </Dropdown.Item>
            </Link>
            <Link href="/languages" passHref>
              <Dropdown.Item active={pathname === '/languages'}>
                <span>Languages</span>
              </Dropdown.Item>
            </Link>
            <Link href="/currencies" passHref>
              <Dropdown.Item active={pathname === '/currencies'}>
                <span>Currencies</span>
              </Dropdown.Item>
            </Link>
            <Link href="/payment-providers" passHref>
              <Dropdown.Item active={pathname === '/payment-providers'}>
                <span>Payment</span>
              </Dropdown.Item>
            </Link>
            <Link href="/delivery-providers" passHref>
              <Dropdown.Item active={pathname === '/delivery-providers'}>
                <span>Delivery</span>
              </Dropdown.Item>
            </Link>
            <Link href="/warehousing-providers" passHref>
              <Dropdown.Item active={pathname === '/warehousing-providers'}>
                <span>Warehousing</span>
              </Dropdown.Item>
            </Link>
          </Dropdown.Menu>
        </Dropdown>
        <Dropdown item icon="user">
          <Dropdown.Menu>
            <Link href="/users/profile" passHref>
              <Dropdown.Item active={pathname === '/users/profile'}>
                <span>Profile</span>
              </Dropdown.Item>
            </Link>
            <Link href="/users/account" passHref>
              <Dropdown.Item active={pathname === '/users/account'}>
                <span>Account</span>
              </Dropdown.Item>
            </Link>
            <Dropdown.Item onClick={doLogout}>Logout</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </Menu.Menu>
    </MenuLayout>
  ) : (
    <MenuLayout pathname={pathname} {...rest} />
  );

export default compose(
  withApollo,
  withHandlers({
    logout: ({ client }) => async () => {
      await logout(client);
    }
  }),
  mapProps(({ client, ...rest }) => ({ ...rest })),
  pure
)(Header);
