import { compose, pure, mapProps, withHandlers } from 'recompose';
import { withApollo } from 'react-apollo';
import { loginWithPassword } from '../../lib/accounts';
import withFormSchema from '../../lib/withFormSchema';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';
import FormSignIn from './FormSignIn';

export default compose(
  withApollo,
  withFormSchema({
    email: {
      type: String,
      label: 'E-Mail Adresse',
    },
    password: {
      type: String,
      label: 'Passwort',
    },
  }),
  withHandlers({
    onSubmit: ({ client }) => ({ email, password }) =>
      // disable hashing so we have a chance to login with any service server-side
      // despite a shared control panel
      loginWithPassword({ email, password, disableHashing: true }, client),
  }),
  withFormErrorHandlers,
  mapProps(({ client, ...rest }) => ({ ...rest })),
  pure,
)(FormSignIn);
