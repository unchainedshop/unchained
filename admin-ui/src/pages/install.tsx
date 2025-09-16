import { useIntl } from 'react-intl';
import RegistrationContainer from '../modules/Auth/RegistrationContainer';

const InitializeUserPage = () => {
  const { formatMessage } = useIntl();

  return (
    <RegistrationContainer
      formHeaderText={formatMessage({
        id: 'install',
        defaultMessage: 'Install',
      })}
      submitButtonText={formatMessage({
        id: 'create_admin_account',
        defaultMessage: 'Create Administrator',
      })}
      disableLoginRedirectLink
      successRedirectPath="/"
    />
  );
};

export default InitializeUserPage;

InitializeUserPage.getLayout = (page) => page;
