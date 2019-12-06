import { log } from 'meteor/unchained:core-logger';

import {
  MessagingDirector,
  MessagingType,
  MessagingAdapter
} from 'meteor/unchained:core-messaging';
import { WorkerDirector } from 'meteor/unchained:core-worker';

const { EMAIL_API_ENDPOINT } = process.env;

if (!EMAIL_API_ENDPOINT)
  log(`EMAIL_API_ENDPOINT not defined`, { level: 'warn' });

class ExternalRestPost extends MessagingAdapter {
  static key = 'shop.unchained.external-rest-post';

  static label = 'External REST Post';

  static version = '1.0';

  static isActivatedFor({ type }) {
    if (type !== MessagingType.EMAIL) return false;
    if (!EMAIL_API_ENDPOINT) return false;
    return true;
  }

  sendMessage(args) {
    const templateResolver = this.resolver(args.template);
    const data = templateResolver(args.meta, this.context);

    WorkerDirector.addWork({
      type: 'HTTP_REQUEST',
      input: {
        url: EMAIL_API_ENDPOINT,
        data
      }
    });
  }
}

MessagingDirector.registerAdapter(ExternalRestPost);
