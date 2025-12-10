import { removeConfidentialServiceHashes, type User } from '@unchainedshop/core-users';
import type { Context } from '../../context.ts';
import normalizeMediaUrl from './normalizeMediaUrl.ts';

const getPrimaryEmail = (user: User) => {
  return (user.emails || []).toSorted(
    (left, right) => Number(right.verified) - Number(left.verified),
  )?.[0];
};

export async function getNormalizedUserDetails(userId: string, context: Context) {
  const { modules, loaders } = context;
  const user = await modules.users.findUserById(userId);
  if (!user) return null;

  const avatar = await loaders.fileLoader.load({
    fileId: user.avatarId!,
  });
  const normalizedAvatar = await normalizeMediaUrl([{ mediaId: avatar?._id } as any], context);

  const primaryEmail = getPrimaryEmail(user);
  const { profile } = user;
  let name = primaryEmail?.address || user._id;
  if (profile && profile.displayName && profile.displayName !== '') name = profile.displayName;

  const walletAddresses =
    user.services?.web3?.flatMap((service) => {
      return service.verified ? [service.address] : [];
    }) || [];

  const tokens = await context.modules.warehousing.findTokensForUser({
    userId: user._id,
    walletAddresses,
  });

  const userLocale = await modules.users.userLocale(user);

  const country = await loaders.countryLoader.load({
    isoCode: userLocale.region!,
  });

  const enrollments = await modules.enrollments.findEnrollments({
    userId: user._id,
  });

  const language = await loaders.languageLoader.load({ isoCode: userLocale.language });
  const orders = await modules.orders.findOrders({
    userId: user._id,
  });

  const paymentCredentials = await modules.payment.paymentCredentials.findPaymentCredentials(
    { userId: user._id },
    {
      sort: {
        created: -1,
      },
    },
  );

  const quotations = await modules.quotations.findQuotations({
    userId: user._id,
  });

  const reviews = await modules.products.reviews.findProductReviews({
    authorId: user._id,
  });
  const safeUser = removeConfidentialServiceHashes(user);

  return {
    ...safeUser,
    avatar: normalizedAvatar,
    primaryEmail,
    name,
    isGuest: !!safeUser?.guest,
    tokens,
    country,
    enrollments,
    language,
    orders,
    paymentCredentials,
    quotations,
    webAuthnCredentials: user?.services?.webAuthn || [],
    web3Addresses: user?.services?.web3 || [],
    reviews,
  };
}
