import { WorkerDirector, WorkerAdapter } from '@unchainedshop/core-worker';
import { createLogger } from '@unchainedshop/logger';
import { IWorkerAdapter } from '@unchainedshop/types/worker.js';
import webPush from 'web-push';

const { PUSH_NOTIFICATION_PUBLIC_KEY, PUSH_NOTIFICATION_PRIVATE_KEY } = process.env;

const logger = createLogger('unchained:worker:push-notification');

type NotificationOptions = {
  vapidDetails: {
    subject: string;
    publicKey: string;
    privateKey: string;
  };
  TTL: number;
  urgency?: 'very-low' | 'low' | 'normal' | 'high';
  topic?: string;
};

const PushNotificationWorkerPlugin: IWorkerAdapter<
  {
    subscription: any;
    payload: string;
    subject: string;
    urgency?: 'very-low' | 'low' | 'normal' | 'high';
    topic?: string;
  },
  any
> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker-plugin.push-notification',
  label: 'Push Notification',

  version: '1.0',

  type: 'PUSH',

  doWork: async ({ subscription, subject, payload, urgency = null, topic = null }) => {
    if (!PUSH_NOTIFICATION_PUBLIC_KEY)
      return {
        success: false,
        error: {
          name: 'VAPID_PUBLIC_KEY_REQUIRED',
          message: 'vapidPublicKey key required to send push notifications',
        },
      };
    if (!PUSH_NOTIFICATION_PRIVATE_KEY)
      return {
        success: false,
        error: {
          name: 'VAPID_PRIVATE_KEY_REQUIRED',
          message: 'vapidPrivateKey key are required to send push notifications',
        },
      };

    if (!subscription) {
      return {
        success: false,
        error: {
          name: 'USER_SUBSCRIPTION_OBJECT_REQUIRED',
          message: 'PUSH service subscription required',
        },
      };
    }

    const options: NotificationOptions = {
      vapidDetails: {
        subject,
        publicKey: PUSH_NOTIFICATION_PUBLIC_KEY,
        privateKey: PUSH_NOTIFICATION_PRIVATE_KEY,
      },
      TTL: 60,
    };

    if (urgency) {
      options.urgency = urgency;
    }

    if (topic) {
      options.topic = topic;
    }

    try {
      await webPush.sendNotification(subscription, payload, options);

      return {
        success: true,
        error: null,
      };
    } catch (err) {
      return {
        success: false,
        error: {
          name: err.name,
          message: err.message,
          stack: err.stack,
        },
      };
    }
  },
};

WorkerDirector.registerAdapter(PushNotificationWorkerPlugin);
