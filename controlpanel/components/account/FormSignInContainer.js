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
      loginWithPassword({ email, password }, client),
  }),
  withFormErrorHandlers,
  mapProps(({ client, ...rest }) => ({ ...rest })),
  pure,
)(FormSignIn);
