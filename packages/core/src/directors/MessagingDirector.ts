export interface EmailTemplateType {
  type: 'EMAIL';
  input: {
    from: string;
    to: string;
    cc?: string;
    subject: string;
    text: string;
    html?: string;
    attachments?: (
      | { filename: string; path: string }
      | {
          filename: string;
          content: string;
          contentType: string;
          encoding: string;
        }
      | { href: string; filename: string }
    )[];
  };
}

export interface SMSTemplateType {
  type: 'TWILIO' | 'BULKGATE' | 'BUDGETSMS';
  input: {
    from: string;
    to: string;
    text: string;
  };
}

export interface ArbitraryTemplateType {
  type: string;
  input: any;
}

export type TemplateResolver<T = Record<string, any>> = (
  params: { template: string } & T,
  unchainedAPI,
) => Promise<(EmailTemplateType | SMSTemplateType | ArbitraryTemplateType)[]>;

const TemplateResolvers = new Map<string, TemplateResolver>();

export const MessagingDirector = {
  registerTemplate: (templateName: string, templateResolver: TemplateResolver) => {
    TemplateResolvers.set(templateName, templateResolver);
  },

  getTemplate: (templateName: string) => TemplateResolvers.get(templateName),

  getRegisteredTemplates: () => Array.from(TemplateResolvers.keys()),
};
