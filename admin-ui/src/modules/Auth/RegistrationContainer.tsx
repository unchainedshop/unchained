import { useRouter } from 'next/router';
import { useState } from 'react';
import useCreateUser from '../accounts/hooks/useCreateUser';
import useGenerateWebAuthCredentials from '../accounts/hooks/useGenerateWebAuthCredentials';
import SignUpForm from '../accounts/components/SignUpForm';
import { OnSubmitSuccessType } from '../forms/hooks/useForm';

interface RegistrationContainerProps {
  formHeaderText: string;
  submitButtonText: string;
  disableLoginRedirectLink?: boolean;
  successRedirectPath?: string;
}

const RegistrationContainer = ({
  formHeaderText,
  submitButtonText,
  disableLoginRedirectLink = false,
  successRedirectPath = '/account',
}: RegistrationContainerProps) => {
  const { push } = useRouter();
  const { createUser } = useCreateUser();
  const { generateWebAuthCredentials } = useGenerateWebAuthCredentials();
  const [authenticateWithDevice, setAuthenticateWithDevice] = useState(false);

  const registerWithWebAuth = async (username: string) => {
    const webAuthnPublicKeyCredentials = await generateWebAuthCredentials({
      username,
    });

    const { data } = await createUser({
      username,
      webAuthnPublicKeyCredentials,
    });

    return data;
  };

  const onSubmit = async (variables: any) => {
    const { username, email, plainPassword } = variables;

    if (authenticateWithDevice) {
      await registerWithWebAuth(username);
      return { success: true };
    }

    const { data, error } = await createUser({
      username,
      email,
      plainPassword,
    });

    const { _id } = data?.createUser || {};
    return _id ? { success: true } : { success: false, data, error };
  };

  const onSubmitSuccess: OnSubmitSuccessType = () => {
    push(successRedirectPath);
    return true;
  };

  return (
    <SignUpForm
      formHeaderText={formHeaderText}
      submitButtonText={submitButtonText}
      disableLoginRedirectLink={disableLoginRedirectLink}
      onSubmit={onSubmit}
      onSubmitSuccess={onSubmitSuccess}
      authenticateWithDevice={authenticateWithDevice}
      onAuthenticateWithDeviceChange={() =>
        setAuthenticateWithDevice((prev) => !prev)
      }
    />
  );
};

export default RegistrationContainer;
