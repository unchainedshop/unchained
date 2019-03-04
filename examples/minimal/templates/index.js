import mjml from 'mjml';
import mustache from 'mustache';
import { configureAccountsEmailTemplates } from 'meteor/unchained:platform';
import {
  MessagingDirector,
  MessagingType
} from 'meteor/unchained:core-messaging';
import { log } from 'meteor/unchained:core-logger';

import './shop.unchained.accounts.verify-email.js'; // eslint-disable-line
import './shop.unchained.accounts.reset-password.js'; // eslint-disable-line
import './shop.unchained.accounts.enroll-account.js'; // eslint-disable-line
import './shop.unchained.orders.confirmation.js'; // eslint-disable-line
import './shop.unchained.send-mail.js'; // eslint-disable-line

const renderToText = (template, data) => {
  try {
    const rendered = mustache.render(template, data);
    return rendered;
  } catch (e) {
    if (e.getMessages) {
      const warning = e.getMessages();
      if (warning) {
        log(warning, { level: 'warn' });
      }
      return null;
    }
    throw e;
  }
};

const renderMjmlToHtml = (template, data) => {
  try {
    const rendered = mustache.render(template, data);
    const { html, errors } = mjml(rendered, { minify: true });
    if (errors) log(JSON.stringify(errors), { level: 'warn' });
    return html;
  } catch (e) {
    if (e.getMessages) {
      const warning = e.getMessages();
      if (warning) {
        log(warning, { level: 'warn' });
      }
      return null;
    }
    throw e;
  }
};

export const getTemplate = template => (meta, context) => {
  try {
    const templateRenderer = require(`./${template}.js`) // eslint-disable-line
    return templateRenderer.default(meta, context, { renderToText, renderMjmlToHtml });
  } catch (e) {
    log(e.message, { level: 'warn' });
    return null;
  }
};

export default () => {
  MessagingDirector.setTemplateResolver(MessagingType.EMAIL, getTemplate);
  configureAccountsEmailTemplates(
    'verifyEmail',
    getTemplate('shop.unchained.accounts.verify-email')
  );
  configureAccountsEmailTemplates(
    'resetPassword',
    getTemplate('shop.unchained.accounts.reset-password')
  );
  configureAccountsEmailTemplates(
    'enrollAccount',
    getTemplate('shop.unchained.accounts.enroll-account')
  );
};
