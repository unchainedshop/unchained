/**
 * Fetch metadata is set by every evergreen browser and never by server-to-server
 * clients, so an absent header means "not a browser" and stays allowed. This keeps
 * the state-changing REST endpoints safe even when a deployment widens
 * UNCHAINED_COOKIE_SAMESITE back to "none".
 */
export const isCrossSiteRequest = (getHeader: (key: string) => string | string[]): boolean => {
  const site = getHeader('sec-fetch-site');
  return (Array.isArray(site) ? site[0] : site) === 'cross-site';
};
