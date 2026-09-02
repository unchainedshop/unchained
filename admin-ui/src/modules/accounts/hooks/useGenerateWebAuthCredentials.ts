import base64ToArrayBuffer from '../../common/utils/base64ToArrayBuffer';
import useCreateWebAuthnCredentialCreationOptions from './useCreateWebAuthnCredentialCreationOptions';

// Convert ArrayBuffer to base64url string (required by @passwordless-id/webauthn)
const arrayBufferToBase64url = (buffer: ArrayBuffer): string => {
  const base64 = window.btoa(String.fromCharCode(...new Uint8Array(buffer)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

interface WebAuthnCreationOptions {
  challenge: string;
  rp: { id?: string; name: string };
  pubKeyCredParams: Array<{ alg: number; type: 'public-key' }>;
  [key: string]: unknown;
}

const useGenerateWebAuthCredentials = () => {
  const { createWebAuthnCredentialCreationOptions } =
    useCreateWebAuthnCredentialCreationOptions();

  const generateWebAuthCredentials = async ({ username }) => {
    const { data } = await createWebAuthnCredentialCreationOptions({
      username,
    });

    const options =
      data.createWebAuthnCredentialCreationOptions as WebAuthnCreationOptions | null;

    const textEncoder = new TextEncoder();
    const publicKey = {
      ...options,
      challenge: base64ToArrayBuffer(options.challenge),
      user: {
        id: textEncoder.encode(username),
        name: username,
        displayName: username,
      },
    };

    const publicKeyCredentials = (await navigator.credentials.create({
      publicKey,
    })) as PublicKeyCredential | null;

    if (!publicKeyCredentials) return null;

    const response =
      publicKeyCredentials.response as AuthenticatorAttestationResponse;

    const attestationObject = arrayBufferToBase64url(
      response.attestationObject,
    );
    const clientDataJSON = arrayBufferToBase64url(response.clientDataJSON);
    const rawId = arrayBufferToBase64url(publicKeyCredentials.rawId);

    // Get authenticatorData from the response (available in newer browsers)
    const authenticatorData = response.getAuthenticatorData
      ? arrayBufferToBase64url(response.getAuthenticatorData())
      : '';

    // Get public key from the response (available in newer browsers)
    const responsePublicKey = response.getPublicKey
      ? arrayBufferToBase64url(response.getPublicKey())
      : '';

    // Get public key algorithm
    const publicKeyAlgorithm = response.getPublicKeyAlgorithm
      ? response.getPublicKeyAlgorithm()
      : -7; // Default to ES256

    // Get transports if available
    const transports = response.getTransports
      ? response.getTransports()
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
