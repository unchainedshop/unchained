import { MessagingDirector, type TemplateResolver } from '@unchainedshop/core';
import { resolveEventCancelledTemplate } from './resolveEventCancelledTemplate.ts';
import { resolveTicketCancelledTemplate } from './resolveTicketCancelledTemplate.ts';

export const TicketingMessageTypes = {
  EVENT_CANCELLED: 'EVENT_CANCELLED',
  TICKET_CANCELLED: 'TICKET_CANCELLED',
} as const;

export type TicketingMessageTypes = (typeof TicketingMessageTypes)[keyof typeof TicketingMessageTypes];

export { resolveEventCancelledTemplate, resolveTicketCancelledTemplate };

const registerTemplateIfAbsent = (templateName: string, templateResolver: TemplateResolver<any>) => {
  if (MessagingDirector.getTemplate(templateName)) return;
  MessagingDirector.registerTemplate(templateName, templateResolver);
};

/**
 * Register the default ticketing cancellation e-mail templates with the shared messaging director.
 * A template the project registered under the same name wins, no matter which one is registered first.
 */
export const registerTicketingTemplates = () => {
  registerTemplateIfAbsent(TicketingMessageTypes.EVENT_CANCELLED, resolveEventCancelledTemplate);
  registerTemplateIfAbsent(TicketingMessageTypes.TICKET_CANCELLED, resolveTicketCancelledTemplate);
};
