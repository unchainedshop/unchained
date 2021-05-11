import React from 'react';
import { withApollo } from '@apollo/client/react/hoc';
import Link from 'next/link';
import { Menu, Dropdown } from 'semantic-ui-react';
import { compose, pure, withHandlers, mapProps } from 'recompose';
import { logout } from '../lib/accounts';

const MenuLayout = ({ pathname, children, loading, ...rest }) => (
  <Menu stackable attached="top" size="tiny" {...rest}>
    <Link href="/" passHref>
      <Menu.Item active={pathname === '/'}>
        <svg
          height="32px"
          viewBox="0 0 620 680"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>unchained logo</title>
          <g
            id="Page-1"
            stroke="none"
            strokeWidth="1"
            fill="none"
            fillRule="evenodd"
          >
            <g id="unchained logo" fill="#333333" fillRule="nonzero">
              <path
                d="M130,220 L177.1,191.8 C167.677774,209.45486 167.677774,230.64514 177.1,248.3 L130,220 Z M14.7,174.8 C8.49123845,204.613515 8.49123845,235.386485 14.7,265.2 L90,220 L14.7,174.8 Z M130,385 L130,280 L18.3,280 C31.110773,325.098728 57.9812724,364.931528 95,393.7 L70,400 L230,500 L230,360 L130,385 Z M230,280 L321.4,337.1 L321.4,337.1 L230,360 L390,460 L390,280 L230,280 Z M70,540 L230,640 L230,500 L70,540 Z M230,500 L390,600 L390,460 L230,500 Z M230,640 L390,680 L390,600 L230,640 Z M70,680 L230,680 L230,640 L70,680 Z M0,470 C0,508.659932 31.3400675,540 70,540 L70,400 C31.3400675,400 0,431.340068 0,470 Z M0,610 C0,648.659932 31.3400675,680 70,680 L70,540 C31.3400675,540 0,571.340068 0,610 Z M550,280 L390,320 L550,420 C588.659932,420 620,388.659932 620,350 C620,311.340068 588.659932,280 550,280 L550,280 Z M550,420 L390,460 L550,560 C588.659932,560 620,528.659932 620,490 C620,451.340068 588.659932,420 550,420 L550,420 Z M550,560 L390,600 L550,680 C583.137085,680 610,653.137085 610,620 C610,586.862915 583.137085,560 550,560 Z M230,0 C129.3,0 44.4,67.7 18.3,160 L390,160 L450,100 C450,100 352.9,0 230,0 Z M310,70 C310,86.5685425 296.568542,100 280,100 C263.431458,100 250,86.5685425 250,70 C250,53.4314575 263.431458,40 280,40 C287.956495,40 295.587112,43.1607052 301.213203,48.7867966 C306.839295,54.4128879 310,62.0435053 310,70 L310,70 Z"
                id="Shape"
              />
            </g>
          </g>
        </svg>
      </Menu.Item>
    </Link>
    {!loading && children}
  </Menu>
);

const Header = ({ pathname, loggedInUser, logout: doLogout, ...rest }) =>
  loggedInUser ? (
    <MenuLayout pathname={pathname} {...rest}>
      <Dropdown item text="System">
        <Dropdown.Menu>
          <Link href="/users" passHref>
            <Menu.Item active={pathname.startsWith('/users')}>
              <span>Users</span>
            </Menu.Item>
          </Link>
          <Link href="/countries" passHref>
            <Dropdown.Item active={pathname.startsWith('/countries')}>
              <span>Countries</span>
            </Dropdown.Item>
          </Link>
          <Link href="/languages" passHref>
            <Dropdown.Item active={pathname.startsWith('/languages')}>
              <span>Languages</span>
            </Dropdown.Item>
          </Link>
          <Link href="/currencies" passHref>
            <Dropdown.Item active={pathname.startsWith('/currencies')}>
              <span>Currencies</span>
            </Dropdown.Item>
          </Link>
          <Link href="/payment-providers" passHref>
            <Dropdown.Item active={pathname.startsWith('/payment-providers')}>
              <span>Payment</span>
            </Dropdown.Item>
          </Link>
          <Link href="/delivery-providers" passHref>
            <Dropdown.Item active={pathname.startsWith('/delivery-providers')}>
              <span>Delivery</span>
            </Dropdown.Item>
          </Link>
          <Link href="/warehousing-providers" passHref>
            <Dropdown.Item
              active={pathname.startsWith('/warehousing-providers')}
            >
              <span>Warehousing</span>
            </Dropdown.Item>
          </Link>
          <Link href="/logs" passHref>
            <Menu.Item active={pathname.startsWith('/logs')}>
              <span>Logs</span>
            </Menu.Item>
          </Link>
        </Dropdown.Menu>
      </Dropdown>
      <Dropdown item text="Master Data">
        <Dropdown.Menu>
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
        </Dropdown.Menu>
      </Dropdown>

      <Dropdown item text="Transactions">
        <Dropdown.Menu>
          <Link href="/orders" passHref>
            <Menu.Item active={pathname.startsWith('/orders')}>
              <span>Orders</span>
            </Menu.Item>
          </Link>
          <Link href="/quotations" passHref>
            <Menu.Item active={pathname.startsWith('/quotations')}>
              <span>Quotations</span>
            </Menu.Item>
          </Link>
          <Link href="/work" passHref>
            <Menu.Item active={pathname.startsWith('/work')}>
              <span>Work</span>
            </Menu.Item>
          </Link>
          <Link href="/events" passHref>
            <Menu.Item active={pathname.startsWith('/events')}>
              <span>Events</span>
            </Menu.Item>
          </Link>
          <Link href="/subscriptions" passHref>
            <Menu.Item active={pathname.startsWith('/subscriptions')}>
              <span>Subscriptions</span>
            </Menu.Item>
          </Link>
        </Dropdown.Menu>
      </Dropdown>
      <Menu.Menu position="right">
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
    logout:
      ({ client }) =>
      async () => {
        await logout(client);
      },
  }),
  mapProps(({ client, ...rest }) => ({ ...rest })),
  pure
)(Header);
