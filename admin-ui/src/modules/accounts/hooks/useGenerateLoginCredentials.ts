import base64ToArrayBuffer from '../../common/utils/base64ToArrayBuffer';
import useCreateWebAuthnCredentialRequestOptions from './useCreateWebAuthnCredentialRequestOptions';

const useGenerateLoginCredentials = () => {
  const { createWebAuthnCredentialRequestOptions } =
    useCreateWebAuthnCredentialRequestOptions();
  const generateLoginCredentials = async ({ username }) => {
    const { data } = await createWebAuthnCredentialRequestOptions({
      username,
    });

    const publicKey = data?.createWebAuthnCredentialRequestOptions;
    if (!publicKey?.allowCredentials?.length) return null;

    publicKey.challenge = base64ToArrayBuffer(publicKey.challenge);

    publicKey.allowCredentials =
      publicKey.allowCredentials?.map(({ id, ...rest }) => ({
        id: base64ToArrayBuffer(id),
        ...rest,
      })) || [];

    const PublicKeyCredentials: any = await navigator.credentials.get({
      publicKey,
    });

    const authenticatorData = window.btoa(
      String.fromCharCode(
        ...new Uint8Array(PublicKeyCredentials.response.authenticatorData),
      ),
    );

    const signature = window.btoa(
      String.fromCharCode(
        ...new Uint8Array(PublicKeyCredentials.response.signature),
      ),
    );

    const userHandle = window.btoa(
      String.fromCharCode(
        ...new Uint8Array(PublicKeyCredentials.response.userHandle),
      ) || username,
    );

    const clientDataJSON = window.btoa(
      String.fromCharCode(
        ...new Uint8Array(PublicKeyCredentials.response.clientDataJSON),
      ),
    );

    const id = window.btoa(
      String.fromCharCode(...new Uint8Array(PublicKeyCredentials.rawId)),
    );

    return {
      requestId: publicKey.requestId,
      id,
      response: {
        clientDataJSON,
        authenticatorData,
        signature,
        userHandle,
      },
    };
  };
  return { generateLoginCredentials };
};

export default useGenerateLoginCredentials;
