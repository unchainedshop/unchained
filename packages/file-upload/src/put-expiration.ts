const { UNCHAINED_PUT_URL_EXPIRY = '86400000' } = process.env;

export const expiryOffsetInMs = () => parseInt(UNCHAINED_PUT_URL_EXPIRY, 10) || 24 * 60 * 60 * 1000;

const resolveExpirationDate = () => new Date(new Date().getTime() + expiryOffsetInMs());

export default resolveExpirationDate;
