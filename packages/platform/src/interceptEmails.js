import fs from 'fs';
import path from 'path';
import os from 'os';
import open from 'open';
import { createLogger } from '@unchainedshop/logger';
import { Email } from 'meteor/email';

const logger = createLogger('unchained:platform');
const mailman = {};

function writeFile(filename, data, done) {
  fs.mkdtemp(path.join(os.tmpdir(), 'mailman-'), (err1, folder) => {
    if (err1) return done(err1);
    const temporaryFolderPath = `${folder}/${filename}`;
    return fs.writeFile(temporaryFolderPath, data, (err2) => {
      if (err2) return done(err2);
      return done(null, temporaryFolderPath);
    });
  });
}

mailman.warnNoEmailPackage = function warnNoEmailPackage() {
  logger.warn(
    'unchained:platform -> Unchained Mail Manager could not start because you are not using the email package',
  );
  logger.warn('unchained:platform -> Please run `meteor add email`');
};

export const interceptEmails = () => {
  if (!Package.email) {
    mailman.warnNoEmailPackage();
    return;
  }

  mailman.originalSend = Email.send;
  mailman.send = function mailmanSend(options) {
    const filename = `${Date.now()}.html`;
    const content = `
      <b>From:&nbsp</b>${options.from}<br/>
      <b>To:&nbsp;</b>${options.to}<br/>
      <b>Cc:&nbsp;</b>${options.cc}<br/>
      <b>Bcc:&nbsp;</b>${options.bcc}<br/>
      <b>Reply-To:&nbsp;</b>${options.replyTo}<br/>
      <br/>
      <b>subject:&nbsp;</b>${options.subject}<br/>
      <b>attachments:&nbsp;</b>${(options.attachments || [])
        .map(({ filename: attachmentFilename, path: attachmentPath }) => {
          const absoluteFilePath = path.join(process.cwd(), attachmentPath);
          return `<a href="${absoluteFilePath}">${attachmentFilename}</a>`;
        })
        .join(',&nbsp;')}<br/>
      <hr/>
      ${(options.html || options.text).replace(/(\r\n|\n|\r)/gm, '<br/>')}
      `;
    writeFile(filename, content, (err, filePath) => {
      if (err) {
        logger.error(err);
        return;
      }
      logger.verbose('unchained:platform -> Mailman detected an outgoing email');
      open(filePath);
    });
  };

  Email.send = mailman.send;
  logger.info('unchained:platform -> E-Mail Interception activated');
};
