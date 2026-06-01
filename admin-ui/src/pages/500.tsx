import ErrorFallback from '@/components/ui/ErrorFallback';

const InternalError = () => {
  return <ErrorFallback />;
};

export default InternalError;

InternalError.getLayout = (page) => page;
