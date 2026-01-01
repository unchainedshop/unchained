import { WorkerDirector, WorkerAdapter, type IWorkerAdapter } from '@unchainedshop/core';
import { spawn } from 'node:child_process';
import { writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:worker:email');

/**
 * Escape HTML special characters to prevent XSS attacks.
 */
function escapeHtml(str: string | undefined | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const checkEmailInterceptionEnabled = () => {
  return process.env.NODE_ENV !== 'production' && !process.env.UNCHAINED_DISABLE_EMAIL_INTERCEPTION;
};

const buildLink = async ({ filename, content, href, contentType, encoding, path }) => {
  const safeFilename = escapeHtml(filename);
  if (path) {
    const safePath = path.startsWith('/') ? path : `${process.cwd()}/${path}`;
    return `<a href="file:/${escapeHtml(safePath)}">${safeFilename}</a>`;
  }
  if (href) {
    return `<a href="${escapeHtml(href)}">${safeFilename}</a>`;
  }
  if (content && encoding === 'base64') {
    // Content-Type should be sanitized, but escape anyway for safety
    return `<a target="_blank" href="data:${escapeHtml(contentType)};base64,${content}">${safeFilename}</a>`;
  }
  return '';
};

let nodemailer;
try {
  const nodemailerModule = await import('nodemailer');
  nodemailer = nodemailerModule.default;
} catch {
  logger.warn(`optional peer npm package 'nodemailer' not installed, emails can't be sent`);
}

const openInBrowser = async (options): Promise<boolean> => {
  const command = {
    darwin: 'open',
    win32: 'explorer.exe',
    linux: 'xdg-open',
  }[process.platform];

  if (!command) {
    return false;
  }

  // Escape plain text body, HTML body is already rendered by the sender
  const messageBody = options.html || escapeHtml(options.text).replace(/(\r\n|\n|\r)/gm, '<br/>');
  const attachmentLinks = await Promise.all((options.attachments || []).map(buildLink));
  const content = `
<!DOCTYPE html>
<html lang="en" xmlns="https://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
  <head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1">
  </head>
  <body>
    <b>From:&nbsp</b>${escapeHtml(options.from)}<br/>
    <b>To:&nbsp;</b>${escapeHtml(options.to)}<br/>
    <b>Cc:&nbsp;</b>${escapeHtml(options.cc)}<br/>
    <b>Bcc:&nbsp;</b>${escapeHtml(options.bcc)}<br/>
    <b>Reply-To:&nbsp;</b>${escapeHtml(options.replyTo)}<br/>
    <br/>
    <b>subject:&nbsp;</b>${escapeHtml(options.subject)}<br/>
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

      if (!nodemailer) {
        return {
          success: false,
          error: {
            name: 'NODEMAILER_NOT_INSTALLED',
            message:
              'npm dependency nodemailer is not installed, please install it to use email features',
          },
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
