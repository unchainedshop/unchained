import { Orders } from 'meteor/unchained:core-orders';

export default async function initializeUsersCart({
  assignCartForUsers = false,
}) {
  await Orders.assignCartForExistingUsers({ assignCartForUsers });
}
