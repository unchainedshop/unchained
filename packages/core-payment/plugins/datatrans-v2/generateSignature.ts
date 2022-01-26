import crypto from 'crypto';

export const Security = {
  NONE: '',
  STATIC_SIGN: 'static-sign',
  DYNAMIC_SIGN: 'dynamic-sign',
};

const generateSignature =
  ({ security, signKey }: { security: '' | 'static-sign' | 'dynamic-sign'; signKey: string }) =>
  (...parts) => {
    // https://docs.datatrans.ch/docs/security-sign
    if (security.toLowerCase() === Security.STATIC_SIGN) return signKey;
    if (security.toLowerCase() === Security.NONE) return '';

    const resultString = parts.filter(Boolean).join('');
    const signKeyInBytes = Buffer.from(signKey, 'hex');

    const signedString = crypto.createHmac('sha256', signKeyInBytes).update(resultString).digest('hex');

    return signedString;
  };

export default generateSignature;
