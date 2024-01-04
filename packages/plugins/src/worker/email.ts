import { mkdtemp, writeFile } from 'fs/promises';
import { join, isAbsolute } from 'path';
import { tmpdir } from 'os';
import { WorkerDirector, WorkerAdapter } from '@unchainedshop/core-worker';
import { createLogger } from '@unchainedshop/logger';
import { IWorkerAdapter } from '@unchainedshop/types/worker.js';
import open from 'open';
import nodemailer from 'nodemailer';

const logger = createLogger('unchained:plugins:worker:email');

export const checkEmailInterceptionEnabled = () => {
  return process.env.NODE_ENV !== 'production' && !process.env.UNCHAINED_DISABLE_EMAIL_INTERCEPTION;
};

const buildLink = ({ filename, content, href, contentType, encoding, path }) => {
  if (path) {
    return `<a href="${isAbsolute(path) ? path : join(process.cwd(), path)}">${filename}</a>`;
  }
  if (href) {
    return `<a href="${href}">${filename}</a>`;
  }
  if (content && encoding === 'base64') {
    return `<a target="_blank" href="${`data:${contentType};base64,${content}=`}">${filename}</a>`;
  }
  return '';
};

const openInBrowser = async (options) => {
  const filename = `${Date.now()}.html`;
  const messageBody = options.html || options.text.replace(/(\r\n|\n|\r)/gm, '<br/>');
  const content = `
<!DOCTYPE html>
<html lang="en" xmlns="https://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
  <head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1">
  </head>
  <body>
    <b>From:&nbsp</b>${options.from}<br/>
    <b>To:&nbsp;</b>${options.to}<br/>
    <b>Cc:&nbsp;</b>${options.cc}<br/>
    <b>Bcc:&nbsp;</b>${options.bcc}<br/>
    <b>Reply-To:&nbsp;</b>${options.replyTo}<br/>
    <br/>
    <b>subject:&nbsp;</b>${options.subject}<br/>
    <b>attachments:&nbsp;</b>${(options.attachments || []).map(buildLink).join(',&nbsp;')}<br/>
    <hr/>
    ${messageBody}
  </body>
</html>`;

  const folder = await mkdtemp(join(tmpdir(), 'email-'));
  const fileName = `${folder}/${filename}`;
  await writeFile(fileName, content);
  return open(fileName);
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
        logger.verbose('unchained:platform -> Mailman detected an outgoing email');
        await openInBrowser(sendMailOptions);
        return { success: true, result: { intercepted: true } };
      }
      if (!process.env.MAIL_URL) {
        return {
          success: false,
          error: { name: 'NO_MAIL_URL_SET', message: 'MAIL_URL is not set' },
        };
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
