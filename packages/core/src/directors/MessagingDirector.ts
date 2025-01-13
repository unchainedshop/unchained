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

export type TemplateResolver<T = { [x: string]: any }> = (
  params: { template: string } & T,
  unchainedAPI,
) => Promise<Array<EmailTemplateType | SMSTemplateType | ArbitraryTemplateType>>;

const TemplateResolvers = new Map<string, TemplateResolver>();

export const MessagingDirector = {
  registerTemplate: (templateName: string, templateResolver: TemplateResolver) => {
    TemplateResolvers.set(templateName, templateResolver);
  },

  getTemplate: (templateName: string) => TemplateResolvers.get(templateName),

  getRegisteredTemplates: () => Array.from(TemplateResolvers.keys()),
};
