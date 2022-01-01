export const LoginMethodResponse = {
  user: async ({ id }: { id: string }, _: never, { modules }) => {
    const user = await modules.user.findUser({ userId: id });
    user._inLoginMethodResponse = true;
    return user;
  },
};
