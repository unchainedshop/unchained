import { compose, mapProps, withHandlers } from 'recompose';
import withMappedError from './withMappedError';

export default compose(
  withMappedError,
  withHandlers({
    onChange: ({ updateMappedError }) => () => {
      updateMappedError(null);
    },
    onSubmitFailure: ({ mapError }) =>
      mapError,
  }),
  mapProps(({
    // strip mapError && updateMappedError, rename mappedError to error
    mappedError, mapError, updateMappedError, ...rest
  }) => ({
    error: mappedError,
    ...rest,
  })),
);
