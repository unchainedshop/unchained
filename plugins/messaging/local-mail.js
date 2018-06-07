import { Email } from 'meteor/email';
import {
  MessagingDirector,
  MessagingType,
  MessagingAdapter,
} from 'meteor/unchained:core-messaging';
import getTemplate from '../../templates';

const {
  MAIL_URL,
  NODE_ENV,
} = process.env;

class LocalMail extends MessagingAdapter {
  static key = 'ch.dagobert.local-mail'
  static label = 'Local Mailer'
  static version = '1.0'

  static isActivatedFor({ type }) {
    if (!MAIL_URL && NODE_ENV === 'production') return false;
    if (type !== MessagingType.EMAIL) return false;
    return true;
  }

  sendMessage({
    template, subject, attachments, meta: {
      to, cc, from, mailPrefix = '', ...meta
    },
  }) {
    const renderer = getTemplate(template)(meta, this.context);
    const message = {
      from: renderer.from(from),
      to: renderer.to(to),
      subject: renderer.subject(subject),
      text: renderer.text && renderer.text(),
      html: renderer.html && renderer.html(),
    };
    if (attachments) {
      message.attachments = attachments.map(media => ({
        filename: `${mailPrefix}${media.name}`,
        path: media.path,
      }));
    }

    this.log(message, { level: 'verbose' });
    return Email.send(message);
  }
}

MessagingDirector.registerAdapter(LocalMail);
