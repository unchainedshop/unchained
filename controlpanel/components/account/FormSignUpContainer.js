import { compose, pure, mapProps, withHandlers } from 'recompose';
import { withApollo } from 'react-apollo';
import { createUser } from '../../lib/accounts';
import withFormSchema from '../../lib/withFormSchema';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';
import FormSignUp from './FormSignUp';

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
      createUser({ email, password }, client),
  }),
  withFormErrorHandlers,
  mapProps(({ client, ...rest }) => ({ ...rest })),
  pure,
)(FormSignUp);
