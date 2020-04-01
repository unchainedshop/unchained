const { EMAIL_FROM } = process.env;

export const defaultSMSResolver = (template) => (meta, context) => ({
  to() {
    return context.order.contact.mobileNumber;
  },
  text() {
    return `${template}: ${JSON.stringify(meta)}`;
  },
});

export const defaultEmailResolver = (template) => (meta, context) => ({
  from() {
    return EMAIL_FROM;
  },
  to() {
    return context.order.contact.emailAddress;
  },
  subject() {
    return template;
  },
  text() {
    return JSON.stringify(meta);
  },
  html() {
    return null;
  },
});

export const defaultApiResolver = () => (meta, context) => ({
  meta() {
    return JSON.stringify(meta);
  },
  payload() {
    return JSON.stringify(context);
  },
});
