const onChangeCallbacks = [];

let tokenStore = {
  async set({ userId, token, tokenExpires }) {
    global.localStorage['Meteor.userId'] = userId;
    global.localStorage['Meteor.loginToken'] = token;
    global.localStorage['Meteor.loginTokenExpires'] = tokenExpires.toString();
  },
  async get() {
    return {
      userId: global.localStorage['Meteor.userId'],
      token: global.localStorage['Meteor.loginToken'],
      tokenExpires: global.localStorage['Meteor.loginTokenExpires'],
    };
  },
};

export const setTokenStore = function setTokenStore(newStore) {
  tokenStore = newStore;
};

const tokenDidChange = async function tokenDidChange() {
  const newData = await tokenStore.get();
  onChangeCallbacks.forEach((callback) => callback(newData));
};

export const storeLoginToken = async function storeLoginToken(
  userId,
  token,
  tokenExpires
) {
  await tokenStore.set({ userId, token, tokenExpires });
  await tokenDidChange();
};

export const getLoginToken = async function getLoginToken() {
  const { token } = await tokenStore.get();
  return token;
};

export const getUserId = async function getUserId() {
  const { userId } = await tokenStore.get();
  return userId;
};

export const onTokenChange = function onTokenChange(callback) {
  onChangeCallbacks.push(callback);
};

export const resetStore = async function resetStore() {
  await storeLoginToken('', '', '');
};
