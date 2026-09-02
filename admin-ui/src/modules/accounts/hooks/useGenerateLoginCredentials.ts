import base64ToArrayBuffer from '../../common/utils/base64ToArrayBuffer';
import useCreateWebAuthnCredentialRequestOptions from './useCreateWebAuthnCredentialRequestOptions';

// Convert ArrayBuffer to base64url string (required by @passwordless-id/webauthn)
const arrayBufferToBase64url = (buffer: ArrayBuffer | Uint8Array): string => {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const base64 = window.btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

interface WebAuthnRequestOptions {
  challenge: string;
  allowCredentials?: Array<{
    id: string;
    type?: 'public-key';
    transports?: Array<'ble' | 'hybrid' | 'internal' | 'nfc' | 'usb'>;
  }>;
  requestId: string;
}

const useGenerateLoginCredentials = () => {
  const { createWebAuthnCredentialRequestOptions } =
    useCreateWebAuthnCredentialRequestOptions();
  const generateLoginCredentials = async ({ username }) => {
    const { data } = await createWebAuthnCredentialRequestOptions({
      username,
    });

    const publicKey =
      data?.createWebAuthnCredentialRequestOptions as WebAuthnRequestOptions | null;
    if (!publicKey?.allowCredentials?.length) return null;

    const preparedKey = {
      challenge: base64ToArrayBuffer(publicKey.challenge),
      allowCredentials:
        publicKey.allowCredentials?.map(({ id, type, ...rest }) => ({
          id: base64ToArrayBuffer(id),
          type: type || 'public-key',
          ...rest,
        })) || [],
    };

    const PublicKeyCredentials = (await navigator.credentials.get({
      publicKey: preparedKey,
    })) as PublicKeyCredential | null;

    if (!PublicKeyCredentials) return null;

    const response =
      PublicKeyCredentials.response as AuthenticatorAssertionResponse;

    const authenticatorData = arrayBufferToBase64url(
      response.authenticatorData,
    );

    const signature = arrayBufferToBase64url(response.signature);

    const userHandle = response.userHandle
      ? arrayBufferToBase64url(response.userHandle)
      : arrayBufferToBase64url(new TextEncoder().encode(username));

    const clientDataJSON = arrayBufferToBase64url(response.clientDataJSON);

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
