import { IMessagingDirector, TemplateResolver } from '@unchainedshop/types/messaging';
import { log } from 'meteor/unchained:logger';

const TemplateResolvers = new Map<string, TemplateResolver>();

export const MessagingDirector: IMessagingDirector = {
  registerTemplate: (templateName, templateResolver) => {
    log(`MessagingDirector -> Registered custom template resolver for ${templateName}`);

    TemplateResolvers.set(templateName, templateResolver);
  },

  getTemplate: (templateName) => TemplateResolvers.get(templateName),
};
