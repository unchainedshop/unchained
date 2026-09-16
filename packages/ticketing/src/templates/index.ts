import { MessagingDirector } from '@unchainedshop/core';
import { resolveEventCancelledTemplate } from './resolveEventCancelledTemplate.ts';
import { resolveTicketCancelledTemplate } from './resolveTicketCancelledTemplate.ts';

export const TicketingMessageTypes = {
  EVENT_CANCELLED: 'EVENT_CANCELLED',
  TICKET_CANCELLED: 'TICKET_CANCELLED',
} as const;

export type TicketingMessageTypes = (typeof TicketingMessageTypes)[keyof typeof TicketingMessageTypes];

export { resolveEventCancelledTemplate, resolveTicketCancelledTemplate };

/** Register the ticketing cancellation e-mail templates with the shared messaging director. */
export const registerTicketingTemplates = () => {
  MessagingDirector.registerTemplate(
    TicketingMessageTypes.EVENT_CANCELLED,
    resolveEventCancelledTemplate,
  );
  MessagingDirector.registerTemplate(
    TicketingMessageTypes.TICKET_CANCELLED,
    resolveTicketCancelledTemplate,
  );
};
