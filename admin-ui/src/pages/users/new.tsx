import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';

import CreateUserForm from '../../modules/accounts/components/CreateUserForm';
import BreadCrumbs from '../../modules/common/components/BreadCrumbs';
import PageHeader from '../../modules/common/components/PageHeader';
import useAuth from '../../modules/Auth/useAuth';
import useEnrollUser from '../../modules/accounts/hooks/useEnrollUser.ts';

const CreateUser = () => {
  const { formatMessage } = useIntl();
  const { enrollUser } = useEnrollUser();
  const { hasRole } = useAuth();
  const router = useRouter();
  const onCreateUser = async (userData) => {
    const { phoneMobile, birthday, gender, password, email, displayName } =
      userData;
    const {
      firstName,
      lastName,
      company,
      addressLine,
      addressLine2,
      postalCode,
      regionCode,
      countryCode,
      city,
    } = userData;

    const result = await enrollUser({
      email,
      password,
      profile: {
        displayName,
        phoneMobile,
        birthday,
        gender,
        address: {
          firstName,
          lastName,
          company,
          addressLine,
          addressLine2,
          postalCode,
          regionCode,
          countryCode,
          city,
        },
      },
    });
    return result;
  };

  const onSubmitSuccess = (_, { enrollUser: user }) => {
    if (hasRole('viewUser')) router.replace(`/users?userId=${user?._id}`);
  };
  return (
    <>
      <BreadCrumbs />
      <PageHeader
        headerText={formatMessage({
          id: 'new_user_header',
          defaultMessage: 'New user',
        })}
      />
      <div className="mt-6">
        <CreateUserForm
          onSubmit={onCreateUser}
          onSubmitSuccess={onSubmitSuccess}
        />
      </div>
    </>
  );
};

export default CreateUser;
