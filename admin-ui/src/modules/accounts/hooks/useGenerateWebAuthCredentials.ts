import base64ToArrayBuffer from '../../common/utils/base64ToArrayBuffer';
import useCreateWebAuthnCredentialCreationOptions from './useCreateWebAuthnCredentialCreationOptions';

const useGenerateWebAuthCredentials = () => {
  const { createWebAuthnCredentialCreationOptions } =
    useCreateWebAuthnCredentialCreationOptions();

  const generateWebAuthCredentials = async ({ username }: { username: string }) => {
    const { data } = await createWebAuthnCredentialCreationOptions({
      username,
    });

    const { createWebAuthnCredentialCreationOptions: options } = data;

    // Prepare the publicKey options for navigator.credentials.create()
    const publicKeyOptions: PublicKeyCredentialCreationOptions = {
      challenge: base64ToArrayBuffer(options.challenge),
      rp: {
        id: options.rp.id,
        name: options.rp.name,
      },
      user: {
        id: new TextEncoder().encode(username),
        name: username,
        displayName: username,
      },
      pubKeyCredParams: options.pubKeyCredParams,
      timeout: options.timeout,
      attestation: options.attestation || 'none',
      authenticatorSelection: options.authenticatorSelection,
    };

    // Create the credential
    const credential = await navigator.credentials.create({
      publicKey: publicKeyOptions,
    }) as PublicKeyCredential | null;

    if (!credential) {
      throw new Error('Credential creation was cancelled or failed');
    }

    // Use the native toJSON() method which is supported in all modern browsers
    // (Firefox 119+, Chrome 129+, Safari 18+)
    // This properly handles all ArrayBuffer encoding and returns the exact format
    // expected by @passwordless-id/webauthn server
    if (typeof credential.toJSON === 'function') {
      const json = credential.toJSON() as any;

      // The toJSON() method returns the credential in the correct format
      // We just need to add the user info that the server expects
      return {
        ...json,
        user: {
          id: username,
          name: username,
          displayName: username,
        },
      };
    }

    // Fallback for browsers without toJSON() support (very old browsers)
    // This should rarely be needed as toJSON() has been available since 2023
    throw new Error(
      'Your browser does not support WebAuthn toJSON(). Please update to a newer browser version.'
    );
  };

  return { generateWebAuthCredentials };
};

export default useGenerateWebAuthCredentials;
