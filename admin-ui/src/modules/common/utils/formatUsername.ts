const formatUsername = (user) => {
  if (!user) return null;
  if (user?.username) return user.username;
  if (user?.profile?.displayName) return user?.profile?.displayName;
  if (user?.profile?.address?.firstName || user?.profile?.address?.lastName)
    return `${user?.profile?.address?.firstName} ${user?.profile?.address?.lastName}`;
  if (user?.name) return user.name;
  if (user.isGuest) return user?.primaryEmail?.address?.split('.')?.[0];
  return null;
};

export default formatUsername;
