import { IMessagingDirector, TemplateResolver } from '@unchainedshop/core-messaging';
import { log } from '@unchainedshop/logger';

const TemplateResolvers = new Map<string, TemplateResolver>();

export const MessagingDirector: IMessagingDirector = {
  registerTemplate: (templateName, templateResolver) => {
    log(`MessagingDirector -> Registered template resolver for ${templateName}`);

    TemplateResolvers.set(templateName, templateResolver);
  },

  getTemplate: (templateName) => TemplateResolvers.get(templateName),
};
