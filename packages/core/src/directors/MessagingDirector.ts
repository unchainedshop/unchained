import { log } from '@unchainedshop/logger';

export type EmailTemplateType = {
  type: 'EMAIL';
  input: {
    from: string;
    to: string;
    cc?: string;
    subject: string;
    text: string;
    html?: string;
    attachments?: Array<
      | { filename: string; path: string }
      | {
          filename: string;
          content: string;
          contentType: string;
          encoding: string;
        }
      | { href: string; filename: string }
    >;
  };
};

export type SMSTemplateType = {
  type: 'SMS';
  input: {
    from: string;
    to: string;
    text: string;
  };
};

export type ArbitraryTemplateType = {
  type: string;
  input: any;
};

export type TemplateResolver = (
  params: { template: string; [x: string]: any },
  unchainedAPI,
) => Promise<Array<EmailTemplateType | SMSTemplateType | ArbitraryTemplateType>>;

export type IMessagingDirector = {
  registerTemplate: (templateName: string, templateResolver: TemplateResolver) => void;
  getTemplate: (templateName: string) => TemplateResolver;
};

const TemplateResolvers = new Map<string, TemplateResolver>();

export const MessagingDirector: IMessagingDirector = {
  registerTemplate: (templateName, templateResolver) => {
    log(`MessagingDirector -> Registered template resolver for ${templateName}`);

    TemplateResolvers.set(templateName, templateResolver);
  },

  getTemplate: (templateName) => TemplateResolvers.get(templateName),
};
