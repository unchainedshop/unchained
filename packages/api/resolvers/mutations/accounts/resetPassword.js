import callMethod from "../../../callMethod";
import hashPassword from "../../../hashPassword";

export default async function(
  root,
  { token, newPlainPassword, newPassword: newHashedPassword },
  context
) {
  if (!newHashedPassword && !newPlainPassword) {
    throw new Error("Password is required");
  }
  const newPassword = newHashedPassword || hashPassword(newPlainPassword);

  return callMethod(context, "resetPassword", token, newPassword);
}
