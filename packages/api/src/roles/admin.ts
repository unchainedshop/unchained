export const admin = (role, actions) => {
  Object.values(actions).forEach((action) => {
    role.allow(action, () => true);
  });
};
