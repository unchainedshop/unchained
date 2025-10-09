import { WorkerDirector, WorkerAdapter, IWorkerAdapter } from '@unchainedshop/core';
import nodemailer from 'nodemailer';
import { spawn } from 'node:child_process';
import { writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const checkEmailInterceptionEnabled = () => {
  return process.env.NODE_ENV !== 'production' && !process.env.UNCHAINED_DISABLE_EMAIL_INTERCEPTION;
};

const buildLink = async ({ filename, content, href, contentType, encoding, path }) => {
  if (path) {
    return `<a href="file:/${path.startsWith('/') ? path : `${process.cwd()}/${path}`}">${filename}</a>`;
  }
  if (href) {
    return `<a href="${href}">${filename}</a>`;
  }
  if (content && encoding === 'base64') {
    return `<a target="_blank" href="${`data:${contentType};base64,${content}`}">${filename}</a>`;
  }
  return '';
};

const openInBrowser = async (options): Promise<boolean> => {
  const command = {
    darwin: 'open',
    win32: 'explorer.exe',
    linux: 'xdg-open',
  }[process.platform];

  if (!command) {
    return false;
  }

  const messageBody = options.html || options.text.replace(/(\r\n|\n|\r)/gm, '<br/>');
  const attachmentLinks = await Promise.all((options.attachments || []).map(buildLink));
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
    <b>attachments:&nbsp;</b>${attachmentLinks.join(',&nbsp;')}<br/>
    <hr/>
    ${messageBody}
  </body>
</html>`;

  // Create a temporary directory and file
  const tempDir = await mkdtemp(join(tmpdir(), 'unchained-email-'));
  const tempFile = join(tempDir, 'email-preview.html');

  await writeFile(tempFile, content, 'utf8');

  return new Promise((resolve) => {
    const child = spawn(command, [tempFile], {
      detached: true,
      stdio: 'ignore',
    });

    child.unref();

    // Resolve immediately after spawning since process is detached
    resolve(true);
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
        const opened = await openInBrowser(sendMailOptions);
        return {
          success: opened,
          result: opened ? { intercepted: true } : undefined,
          error: !opened ? { message: "Interception failed due to missing package 'open'" } : undefined,
        };
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
