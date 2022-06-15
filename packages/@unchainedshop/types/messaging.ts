import { Context } from './api';

export type EmailTemplateType = {
  type: 'EMAIL';
  input: {
    from: string;
    to: string;
    cc?: string;
    subject: string;
    text: string;
    html?: string;
    attachments?: Array<{ filename: string; path: string }>;
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
  requestContext: Context,
) => Promise<Array<EmailTemplateType | SMSTemplateType | ArbitraryTemplateType>>;

export interface MessagingModule {
  renderToText: (template: string, data: Record<string, any>) => string;
  renderMjmlToHtml: (template: string, data: Record<string, any>) => string;
}

export type IMessagingDirector = {
  registerTemplate: (templateName: string, templateResolver: TemplateResolver) => void;
  getTemplate: (templateName: string) => TemplateResolver;
};
