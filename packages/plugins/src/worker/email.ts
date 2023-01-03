import { WorkerDirector, WorkerAdapter } from '@unchainedshop/core-worker';
import { createLogger } from '@unchainedshop/logger';
import { IWorkerAdapter } from '@unchainedshop/types/worker.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import open from 'open';
import nodemailer from 'nodemailer';

const logger = createLogger('unchained:plugins:worker:email');

const checkEmailInterceptionEnabled = () => {
  return process.env.NODE_ENV !== 'production' && !process.env.UNCHAINED_DISABLE_EMAIL_INTERCEPTION;
};

function writeFile(filename, data, done) {
  fs.mkdtemp(path.join(os.tmpdir(), 'email-'), (err1, folder) => {
    if (err1) return done(err1);
    const temporaryFolderPath = `${folder}/${filename}`;
    return fs.writeFile(temporaryFolderPath, data, (err2) => {
      if (err2) return done(err2);
      return done(null, temporaryFolderPath);
    });
  });
}

const openInBrowser = (options) => {
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

const EmailWorkerPlugin: IWorkerAdapter<
  {
    from?: string;
    to?: string;
    subject?: string;
    [x: string]: any;
  },
  any
> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker-plugin.email',
  label: 'Send a Mail through Nodemailer',
  version: '1.0.0',
  type: 'EMAIL',

  doWork: async ({ from, to, subject, ...rest }) => {
    logger.debug(`${EmailWorkerPlugin.key} -> doWork: ${from} -> ${to} (${subject})`);

    if (!to) {
      return {
        success: false,
        error: {
          name: 'RECIPIENT_REQUIRED',
          message: 'EMAIL requires a to',
        },
      };
    }

    try {
      const sendMailOptions = {
        from,
        to,
        subject,
        ...rest,
      };
      if (checkEmailInterceptionEnabled()) {
        openInBrowser(sendMailOptions);
        return { success: true, result: { intercepted: true } };
      }
      if (!process.env.MAIL_URL) {
        return { success: false, error: { name: 'NO_MAIL_URL_SET', message: 'MAIL_URL is not set' } };
      }
      const transporter = nodemailer.createTransport(process.env.MAIL_URL);
      const result = await transporter.sendMail(sendMailOptions);
      return { success: true, result };
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

WorkerDirector.registerAdapter(EmailWorkerPlugin);
