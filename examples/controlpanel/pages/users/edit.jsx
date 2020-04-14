import React from 'react';
import { withRouter } from 'next/router';
import { toast } from 'react-toastify';
import { compose, pure, withHandlers } from 'recompose';
import { Container, Grid, Menu, Segment } from 'semantic-ui-react';
import App from '../../components/App';
import FormProfile from '../../components/users/FormProfile';
import UserOrderList from '../../components/users/UserOrderList';
import UserLogList from '../../components/users/UserLogList';
import FormSetPassword from '../../components/account/FormSetPassword';
import EmailsList from '../../components/account/EmailsList';
import FormSetRoles from '../../components/account/FormSetRoles';
import FormTags from '../../components/account/FormTags';
import FormSetUsername from '../../components/account/FormSetUsername';

import connectApollo from '../../lib/connectApollo';

const UsersEdit = ({ router, redirect, changeTab, ...rest }) => (
  <App {...rest}>
    <Container>
      <Grid>
        <Grid.Row>
          <Grid.Column width={3}>
            <Menu fluid vertical tabular>
              <Menu.Item active={!router.query.tab} name="" onClick={changeTab}>
                Profile
              </Menu.Item>
              <Menu.Item
                active={router.query.tab === 'account'}
                name="account"
                onClick={changeTab}
              >
                Account
              </Menu.Item>
              <Menu.Item
                active={router.query.tab === 'orders'}
                name="orders"
                onClick={changeTab}
              >
                Orders
              </Menu.Item>
              <Menu.Item
                active={router.query.tab === 'log'}
                name="log"
                onClick={changeTab}
              >
                Logs
              </Menu.Item>
            </Menu>
          </Grid.Column>
          <Grid.Column stretched width={12}>
            {!router.query.tab && (
              <FormProfile
                onSubmitSuccess={redirect}
                userId={router.query._id}
              />
            )}
            {router.query.tab === 'account' && (
              <div>
                <Segment>
                  <h3 className="title">Set username</h3>
                  <FormSetUsername
                    onSubmitSuccess={redirect}
                    userId={router.query._id}
                  />
                </Segment>
                <Segment>
                  <h3 className="title">Set password</h3>
                  <FormSetPassword
                    onSubmitSuccess={redirect}
                    userId={router.query._id}
                  />
                </Segment>
                <Segment>
                  <h3 className="title">Edit E-Mail addresses</h3>
                  <EmailsList
                    onSubmitSuccess={redirect}
                    userId={router.query._id}
                    disableResendVerificationEmail
                  />
                </Segment>
                <Segment>
                  <h3 className="title">Set roles</h3>
                  <FormSetRoles
                    onSubmitSuccess={redirect}
                    userId={router.query._id}
                  />
                </Segment>
                <Segment>
                  <h3 className="title">Set tags</h3>
                  <FormTags
                    onSubmitSuccess={redirect}
                    userId={router.query._id}
                  />
                </Segment>
              </div>
            )}
            {router.query.tab === 'orders' && (
              <UserOrderList userId={router.query._id} />
            )}
            {router.query.tab === 'log' && (
              <UserLogList userId={router.query._id} />
            )}
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Container>
  </App>
);

export default connectApollo(
  compose(
    withRouter,
    withHandlers({
      changeTab: ({ router }) => (event, element) => {
        const newUrl = router;
        newUrl.query.tab = element.name;
        router.replace(newUrl);
      },
      redirect: () => () => {
        toast('User updated', { type: toast.TYPE.SUCCESS });
      },
    }),
    pure
  )(UsersEdit)
);
