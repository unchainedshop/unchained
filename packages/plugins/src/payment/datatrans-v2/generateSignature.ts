export const Security = {
  NONE: '',
  STATIC_SIGN: 'static-sign',
  DYNAMIC_SIGN: 'dynamic-sign',
};

const generateSignature =
  ({ security, signKey }: { security: '' | 'static-sign' | 'dynamic-sign'; signKey: string }) =>
  async (...parts) => {
    // https://docs.datatrans.ch/docs/security-sign
    if (security.toLowerCase() === Security.STATIC_SIGN) return signKey;
    if (security.toLowerCase() === Security.NONE) return '';

    const resultString = parts.filter(Boolean).join('');
    const signKeyInBytes = Buffer.from(signKey, 'hex');

    const key = await crypto.subtle.importKey(
      'raw',
      signKeyInBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify'],
    );
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(resultString));
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  };

export default generateSignature;
