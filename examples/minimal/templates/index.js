import './order-confirmation';
// import { configureAccountsEmailTemplates } from 'meteor/unchained:platform';
// import {
//   MessagingDirector,
//   MessagingType,
// } from 'meteor/unchained:core-messaging';
// import { log } from 'meteor/unchained:core-logger';
//
// import './shop.unchained.accounts.verify-email.js'; // eslint-disable-line
// import './shop.unchained.accounts.reset-password.js'; // eslint-disable-line
// import './shop.unchained.accounts.enroll-account.js'; // eslint-disable-line
// import './shop.unchained.orders.confirmation.js'; // eslint-disable-line
// import './shop.unchained.send-mail.js'; // eslint-disable-line
//
// export const getTemplate = (template) => (meta, context) => {
//   try {
//     const templateRenderer = require(`./${template}.js`); // eslint-disable-line
//     return templateRenderer.default(meta, context, {
//       renderToText: MessagingDirector.renderToText,
//       renderMjmlToHtml: MessagingDirector.renderMjmlToHtml,
//     });
//   } catch (e) {
//     log(e.message, { level: 'warn' });
//     return null;
//   }
// };

export default () => {
  // MessagingDirector.setTemplateResolver(MessagingType.EMAIL, getTemplate);
  // configureAccountsEmailTemplates(
  //   'verifyEmail',
  //   getTemplate('shop.unchained.accounts.verify-email')
  // );
  // configureAccountsEmailTemplates(
  //   'resetPassword',
  //   getTemplate('shop.unchained.accounts.reset-password')
  // );
  // configureAccountsEmailTemplates(
  //   'enrollAccount',
  //   getTemplate('shop.unchained.accounts.enroll-account')
  // );
};
