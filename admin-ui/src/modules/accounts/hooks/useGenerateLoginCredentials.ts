import base64ToArrayBuffer from '../../common/utils/base64ToArrayBuffer';
import useCreateWebAuthnCredentialRequestOptions from './useCreateWebAuthnCredentialRequestOptions';

// Convert ArrayBuffer to base64url string (required by @passwordless-id/webauthn)
const arrayBufferToBase64url = (buffer: ArrayBuffer | Uint8Array): string => {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const base64 = window.btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

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

    const authenticatorData = arrayBufferToBase64url(
      PublicKeyCredentials.response.authenticatorData,
    );

    const signature = arrayBufferToBase64url(
      PublicKeyCredentials.response.signature,
    );

    const userHandle = PublicKeyCredentials.response.userHandle
      ? arrayBufferToBase64url(PublicKeyCredentials.response.userHandle)
      : arrayBufferToBase64url(new TextEncoder().encode(username));

    const clientDataJSON = arrayBufferToBase64url(
      PublicKeyCredentials.response.clientDataJSON,
    );

    const id = arrayBufferToBase64url(PublicKeyCredentials.rawId);

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
