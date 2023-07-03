export const OAuthProvider = {
  _id: (adapter) => adapter.provider,
  clientId: (adapter) => adapter.config?.clientId,
  scopes: (adapter) => adapter.config?.scopes || [],
};
