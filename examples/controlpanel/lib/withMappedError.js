import { compose, withHandlers, withState } from 'recompose';

export default compose(
  withState('mappedError', 'updateMappedError', null),
  withHandlers({
    mapError:
      ({ updateMappedError }) =>
      (error) => {
        const graphQLError = error.graphQLErrors && error.graphQLErrors[0];
        const message = graphQLError && graphQLError.message;
        if (message === 'User not found [403]') {
          updateMappedError(new Error('User not found'));
          return;
        }
        if (message === 'Email already exists. [403]') {
          updateMappedError(new Error('E-Mail existiert already exists, reset?'));
          return;
        }
        if (message === 'Incorrect password [403]') {
          updateMappedError(new Error('Please check your password'));
          return;
        }
        if (graphQLError) {
          updateMappedError(graphQLError);
        } else {
          updateMappedError(error);
        }
      },
  }),
);
