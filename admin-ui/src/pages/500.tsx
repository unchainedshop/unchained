import ErrorFallback from '../modules/common/components/ErrorFallback';

const InternalError = () => {
  return <ErrorFallback />;
};

export default InternalError;

InternalError.getLayout = (page) => page;
