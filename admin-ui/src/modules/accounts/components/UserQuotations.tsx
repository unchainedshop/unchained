import { useRouter } from 'next/router';
import Loading from '../../common/components/Loading';
import SearchField from '../../common/components/SearchField';
import QuotationList from '../../quotation/components/QuotationList';
import useUserQuotations from '../../quotation/hooks/useUserQuotations';

const UserQuotations = ({ _id: userId }) => {
  const { query, push } = useRouter();
  const { queryString, ...rest } = query;

  const setQueryString = (searchString) => {
    const { skip, ...withoutSkip } = rest;
    if (searchString)
      push({
        query: {
          ...withoutSkip,
          queryString: searchString,
        },
      });
    else
      push({
        query: {
          ...rest,
        },
      });
  };
  const { quotations, loading } = useUserQuotations({
    userId,
    queryString: queryString as string,
  });

  if (loading) return <Loading />;
  return (
    <div className="space-y-4 mt-4">
      <SearchField defaultValue={queryString} onInputChange={setQueryString} />
      <QuotationList quotations={quotations} />
    </div>
  );
};

export default UserQuotations;
