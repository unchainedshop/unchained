import { UnchainedCore } from './core.js';

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

export type PushNotificationTemplateType = {
  type: 'PUSH';
  input: {
    subscription: any;
    title: string;
    body: string;
    url: string;
  };
};
export type TemplateResolver = (
  params: { template: string; [x: string]: any },
  unchainedAPI: UnchainedCore,
) => Promise<Array<EmailTemplateType | SMSTemplateType | ArbitraryTemplateType>>;

export interface MessagingModule {
  renderToText: (template: string, data: Record<string, any>) => string;
  renderMjmlToHtml: (template: string, data: Record<string, any>) => string;
}

export type IMessagingDirector = {
  registerTemplate: (templateName: string, templateResolver: TemplateResolver) => void;
  getTemplate: (templateName: string) => TemplateResolver;
};

export type SaveSubscriptionObjectParams = (
  { subscription, userId, userAgent },
  context: UnchainedCore,
) => Promise<void>;

export type PushEnabledByUserParams = (
  { subscription, userId, userAgent },
  context: UnchainedCore,
) => Promise<void>;

export type DeleteUserSubscriptionObjectParams = (
  { userId, userAgent },
  context: UnchainedCore,
) => Promise<void>;

export interface PushNotificationServices {
  saveUserSubscriptionObject: SaveSubscriptionObjectParams;
  pushEnabledByUser: PushEnabledByUserParams;
  deleteUserSubscriptionObject: DeleteUserSubscriptionObjectParams;
}

export interface MessagingServices {
  pushNotification: PushNotificationServices;
}
