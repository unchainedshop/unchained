import { useRouter } from 'next/router';
import SearchField from '../../common/components/SearchField';
import EnrollmentList from '../../enrollment/components/EnrollmentList';
import useUserEnrollments from '../../enrollment/hooks/useUserEnrollments';

const UserEnrollments = ({ _id: userId }) => {
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

  const { enrollments } = useUserEnrollments({
    userId,
    queryString: queryString as string,
  });

  return (
    <div className="space-y-4 mt-4">
      <SearchField defaultValue={queryString} onInputChange={setQueryString} />
      <EnrollmentList enrollments={enrollments} />
    </div>
  );
};

export default UserEnrollments;
