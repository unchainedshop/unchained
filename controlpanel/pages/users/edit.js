import React from 'react';
import { toast } from 'react-toastify';
import { compose, pure, withHandlers } from 'recompose';
import { Container, Grid, Menu, Segment } from 'semantic-ui-react';
import Router from 'next/router';
import App from '../../components/AppContainer';
import FormProfile from '../../components/users/FormProfileContainer';
import UserOrderList from '../../components/users/UserOrderList';
import UserLogList from '../../components/users/UserLogList';
import FormSetPassword from '../../components/account/FormSetPassword';
import FormChangeEmail from '../../components/account/FormChangeEmailContainer';
import FormSetRoles from '../../components/account/FormSetRoles';
import connectApollo from '../../lib/connectApollo';

const UsersEdit = ({
  url, redirect, changeTab, ...rest
}) => (
  <App url={url} {...rest}>
    <Container>
      <Grid>
        <Grid.Row>
          <Grid.Column width={3}>
            <Menu fluid vertical tabular>
              <Menu.Item active={!url.query.tab} name="" onClick={changeTab}>
                Profil
              </Menu.Item>
              <Menu.Item active={url.query.tab === 'account'} name="account" onClick={changeTab}>
                Konto
              </Menu.Item>
              <Menu.Item active={url.query.tab === 'orders'} name="orders" onClick={changeTab}>
                Bestellungen
              </Menu.Item>
              <Menu.Item active={url.query.tab === 'log'} name="log" onClick={changeTab}>
                Log
              </Menu.Item>
            </Menu>
          </Grid.Column>
          <Grid.Column stretched width={12}>
            {!url.query.tab && (
              <FormProfile onSubmitSuccess={redirect} userId={url.query._id} />
            )}
            {url.query.tab === 'account' && (
              <div>
                <Segment>
                  <h3 className="title">Set password</h3>
                  <FormSetPassword onSubmitSuccess={redirect} userId={url.query._id} />
                </Segment>
                <Segment>
                  <h3 className="title">Change E-Mail address</h3>
                  <FormChangeEmail
                    onSubmitSuccess={redirect}
                    userId={url.query._id}
                    disableResendVerificationEmail
                  />
                </Segment>
                <Segment>
                  <h3 className="title">Set roles</h3>
                  <FormSetRoles onSubmitSuccess={redirect} userId={url.query._id} />
                </Segment>
              </div>
            )}
            {url.query.tab === 'orders' && (
              <UserOrderList userId={url.query._id} />
            )}
            {url.query.tab === 'log' && (
              <UserLogList userId={url.query._id} />
            )}
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Container>
  </App>
);

export default connectApollo(compose(
  withHandlers({
    changeTab: ({ url }) => (event, element) => {
      const newUrl = url;
      newUrl.query.tab = element.name;
      Router.replace(newUrl);
    },
    redirect: () => () => {
      toast('User updated', { type: toast.TYPE.SUCCESS });
    },
  }),
  pure,
)(UsersEdit));
