import { WorkerDirector, WorkerAdapter, type IWorkerAdapter } from '@unchainedshop/core';
import { spawn } from 'node:child_process';
import { writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:worker:email');

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

let nodemailer;
try {
  const nodemailerModule = await import('nodemailer');
  nodemailer = nodemailerModule.default;
} catch {
  logger.warn(`optional peer npm package 'nodemailer' not installed, emails can't be sent`);
}

export const parseMailUrls = (raw?: string): string[] => raw?.trim().split(/\s+/).filter(Boolean) ?? [];

export const sanitizeMailUrl = (mailUrl: string, index: number): string => {
  try {
    const { protocol, host } = new URL(mailUrl);
    if (!host) throw new Error('no host');
    return `${protocol}//${host}`;
  } catch {
    return `transport #${index + 1}`;
  }
};

const cachedTransports = new Map();
const getCachedTransport = (mailUrl: string) => {
  if (!cachedTransports.has(mailUrl)) {
    cachedTransports.set(mailUrl, nodemailer.createTransport(mailUrl));
  }
  return cachedTransports.get(mailUrl);
};

export interface FailedMailAttempt {
  transport: string;
  name?: string;
  message: string;
  responseCode?: number;
}

export const sendMailWithFallback = async (
  mailUrls: string[],
  sendMailOptions: Record<string, any>,
  createTransport: (mailUrl: string) => {
    sendMail: (options: Record<string, any>) => Promise<any>;
  } = getCachedTransport,
): Promise<{ info: any; transport: string; failedAttempts: FailedMailAttempt[] }> => {
  const failedAttempts: FailedMailAttempt[] = [];
  for (const [index, mailUrl] of mailUrls.entries()) {
    const transport = sanitizeMailUrl(mailUrl, index);
    try {
      const info = await createTransport(mailUrl).sendMail(sendMailOptions);
      return { info, transport, failedAttempts };
    } catch (err) {
      failedAttempts.push({
        transport,
        name: err.name,
        message: err.message,
        responseCode: err.responseCode,
      });
      logger.warn(
        `sending mail through ${transport} failed${index < mailUrls.length - 1 ? ', trying next transport' : ''}`,
        { transport, error: err.message },
      );
    }
  }
  const error = new Error(
    `Sending mail failed, all ${mailUrls.length} transport(s) errored`,
  ) as Error & { failedAttempts: FailedMailAttempt[] };
  error.failedAttempts = failedAttempts;
  throw error;
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
  version: '1.1.0',
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

      const mailUrls = parseMailUrls(process.env.MAIL_URL);
      if (!mailUrls.length) {
        return {
          success: false,
          error: {
            name: 'NO_MAIL_URL_SET',
            message: 'MAIL_URL is not set (one or more whitespace-separated SMTP urls)',
          },
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

      const { info, transport, failedAttempts } = await sendMailWithFallback(mailUrls, sendMailOptions);
      return {
        success: true,
        result: {
          ...info,
          transport,
          ...(failedAttempts.length ? { failedAttempts } : {}),
        },
      };
    } catch (err) {
      return {
        success: false,
        error: {
          name: err.name,
          message: err.message,
          stack: err.stack,
          ...(err.failedAttempts ? { failedAttempts: err.failedAttempts } : {}),
        },
      };
    }
  },
};

WorkerDirector.registerAdapter(EmailWorkerPlugin);
