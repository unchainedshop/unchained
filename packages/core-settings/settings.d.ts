declare module 'meteor/unchained:core-settings' {
  function getSetting(string): Record<string, unknown> | void;

  // eslint-disable-next-line import/prefer-default-export
  export { getSetting };
}
