import base64ToArrayBuffer from '../../common/utils/base64ToArrayBuffer';
import useCreateWebAuthnCredentialCreationOptions from './useCreateWebAuthnCredentialCreationOptions';

const useGenerateWebAuthCredentials = () => {
  const { createWebAuthnCredentialCreationOptions } =
    useCreateWebAuthnCredentialCreationOptions();

  const generateWebAuthCredentials = async ({ username }) => {
    const { data } = await createWebAuthnCredentialCreationOptions({
      username,
    });

    const { createWebAuthnCredentialCreationOptions: publicKey } = data;

    const textEncoder = new TextEncoder();
    publicKey.challenge = base64ToArrayBuffer(publicKey.challenge);
    publicKey.user = {
      id: textEncoder.encode(username),
      name: username,
      displayName: username,
    };

    const publicKeyCredentials: any = await navigator.credentials.create({
      publicKey,
    });

    const attestationObject = window.btoa(
      String.fromCharCode(
        ...new Uint8Array(publicKeyCredentials.response.attestationObject),
      ),
    );
    const clientDataJSON = window.btoa(
      String.fromCharCode(
        ...new Uint8Array(publicKeyCredentials.response.clientDataJSON),
      ),
    );
    const rawId = window.btoa(
      String.fromCharCode(...new Uint8Array(publicKeyCredentials.rawId)),
    );

    return {
      id: rawId,
      response: {
        clientDataJSON,
        attestationObject,
      },
    };
  };

  return { generateWebAuthCredentials };
};

export default useGenerateWebAuthCredentials;
