import webPush from 'web-push';

const { PUSH_NOTIFICATION_PUBLIC_KEY, PUSH_NOTIFICATION_PRIVATE_KEY } = process.env;

const send = async ({ subscription, userId, title, url, body }) => {
  if (!PUSH_NOTIFICATION_PUBLIC_KEY || !PUSH_NOTIFICATION_PRIVATE_KEY)
    throw new Error('vapidPublicKey & vapidPrivateKey keys are required to send push notifications');
  if (!userId) return null;

  const options = {
    vapidDetails: {
      subject: url,
      publicKey: PUSH_NOTIFICATION_PUBLIC_KEY,
      privateKey: PUSH_NOTIFICATION_PRIVATE_KEY,
    },
    TTL: 60,
  };
  return webPush.sendNotification(
    subscription,
    JSON.stringify({
      title,
      body,
      url,
    }),
    options,
  );
};

export default send;
