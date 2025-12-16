import base64ToArrayBuffer from '../../common/utils/base64ToArrayBuffer';
import useCreateWebAuthnCredentialCreationOptions from './useCreateWebAuthnCredentialCreationOptions';

// Convert ArrayBuffer to base64url string (required by @passwordless-id/webauthn)
const arrayBufferToBase64url = (buffer: ArrayBuffer): string => {
  const base64 = window.btoa(String.fromCharCode(...new Uint8Array(buffer)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

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

    const attestationObject = arrayBufferToBase64url(
      publicKeyCredentials.response.attestationObject,
    );
    const clientDataJSON = arrayBufferToBase64url(
      publicKeyCredentials.response.clientDataJSON,
    );
    const rawId = arrayBufferToBase64url(publicKeyCredentials.rawId);

    // Get authenticatorData from the response (available in newer browsers)
    const authenticatorData = publicKeyCredentials.response.getAuthenticatorData
      ? arrayBufferToBase64url(
          publicKeyCredentials.response.getAuthenticatorData(),
        )
      : '';

    // Get public key from the response (available in newer browsers)
    const responsePublicKey = publicKeyCredentials.response.getPublicKey
      ? arrayBufferToBase64url(publicKeyCredentials.response.getPublicKey())
      : '';

    // Get public key algorithm
    const publicKeyAlgorithm = publicKeyCredentials.response
      .getPublicKeyAlgorithm
      ? publicKeyCredentials.response.getPublicKeyAlgorithm()
      : -7; // Default to ES256

    // Get transports if available
    const transports = publicKeyCredentials.response.getTransports
      ? publicKeyCredentials.response.getTransports()
      : ['internal'];

    return {
      id: rawId,
      rawId,
      response: {
        clientDataJSON,
        attestationObject,
        authenticatorData,
        publicKey: responsePublicKey,
        publicKeyAlgorithm,
        transports,
      },
      authenticatorAttachment:
        publicKeyCredentials.authenticatorAttachment || 'platform',
      clientExtensionResults:
        publicKeyCredentials.getClientExtensionResults?.() || {},
      type: 'public-key',
      user: {
        id: username,
        name: username,
        displayName: username,
      },
    };
  };

  return { generateWebAuthCredentials };
};

export default useGenerateWebAuthCredentials;
