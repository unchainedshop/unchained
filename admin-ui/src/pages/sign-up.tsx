import RegistrationContainer from '../modules/Auth/RegistrationContainer';
import { useIntl } from 'react-intl';

const SignUpPage = () => {
  const { formatMessage } = useIntl();

  return (
    <RegistrationContainer
      formHeaderText={formatMessage({
        id: 'sign_up_header',
        defaultMessage: 'Create new account',
      })}
      submitButtonText={formatMessage({
        id: 'sign_up',
        defaultMessage: 'Sign up',
      })}
    />
  );
};

export default SignUpPage;

SignUpPage.getLayout = (page) => page;
