import { Context } from './api';

export type TemplateResolver = (
  params: { template: string; [x: string]: any },
  requestContext: Context,
) => Promise<
  Array<{
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
  }>
>;

export interface MessagingModule {
  renderToText: (template: string, data: { subject: string } & Record<string, any>) => string;
  renderMjmlToHtml: (template: string, data: { subject: string } & Record<string, any>) => string;
}

export type IMessagingDirector = {
  registerTemplate: (templateName: string, templateResolver: TemplateResolver) => void;
  getTemplate: (templateName: string) => TemplateResolver;
};
