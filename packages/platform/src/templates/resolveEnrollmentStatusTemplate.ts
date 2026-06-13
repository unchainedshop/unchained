import type { TemplateResolver } from '@unchainedshop/core';

const { EMAIL_FROM, EMAIL_WEBSITE_NAME, EMAIL_WEBSITE_URL } = process.env;

const reasonSubjects: Record<string, string> = {
  status_change: 'Subscription Status Update',
  plan_change: 'Subscription Plan Changed',
  updated_plan: 'Subscription Plan Updated',
};

const statusDescriptions: Record<string, string> = {
  INITIAL: 'Your subscription has been created and is being set up.',
  ACTIVE: 'Your subscription is now active.',
  PAUSED: 'Your subscription has been paused. It will resume automatically when conditions are met.',
  SUSPENDED:
    'Your subscription has been suspended. No new orders will be generated until it is resumed.',
  TERMINATED: 'Your subscription has been terminated. No further orders will be generated.',
};

function formatDate(date: Date | string | undefined, locale = 'en'): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export const resolveEnrollmentStatusTemplate: TemplateResolver = async (
  { enrollmentId, reason, locale: localeString },
  context,
) => {
  const { modules } = context;
  const enrollment = await modules.enrollments.findEnrollment({ enrollmentId });
  const user = await modules.users.findUserById(enrollment.userId);
  const locale = new Intl.Locale(localeString || 'en');
  const product = await modules.products.findProduct({ productId: enrollment.productId });
  const productTexts = product
    ? await modules.products.texts.findLocalizedText({ productId: product._id, locale })
    : null;
  const productTitle = productTexts?.title || enrollment.productId;

  const subjectAction = reasonSubjects[reason] || 'Subscription Update';
  const subject = `${EMAIL_WEBSITE_NAME}: ${subjectAction} — ${enrollment.enrollmentNumber}`;
  const url = `${EMAIL_WEBSITE_URL}/enrollment?_id=${enrollment._id}`;

  const statusMessage = statusDescriptions[enrollment.status] || '';

  const currentPeriod = enrollment.periods?.find((p) => {
    const now = Date.now();
    return new Date(p.start).getTime() <= now && new Date(p.end).getTime() >= now;
  });

  const sections: string[] = [];

  sections.push(`Subscription: ${enrollment.enrollmentNumber}`);
  sections.push(`Status: ${enrollment.status}`);
  if (statusMessage) sections.push(`\n${statusMessage}`);

  sections.push(`\n--- Plan Details ---`);
  sections.push(`Product: ${productTitle}`);
  sections.push(`Quantity: ${enrollment.quantity || 1}`);

  if (currentPeriod) {
    sections.push(`\n--- Current Period ---`);
    sections.push(`Start: ${formatDate(currentPeriod.start, locale.baseName)}`);
    sections.push(`End: ${formatDate(currentPeriod.end, locale.baseName)}`);
    if (currentPeriod.isTrial) sections.push(`(Trial period)`);
  }

  if (enrollment.requestedTerminationDate) {
    sections.push(`\n--- Scheduled Termination ---`);
    sections.push(
      `Your subscription is scheduled to end on ${formatDate(enrollment.requestedTerminationDate, locale.baseName)}.`,
    );
    sections.push(`You will continue to have access until that date.`);
    if (enrollment.cancellationReason) {
      sections.push(`Reason: ${enrollment.cancellationReason}`);
    }
    if (enrollment.cancellationComment) {
      sections.push(`Comment: ${enrollment.cancellationComment}`);
    }
  }

  if (enrollment.resumeAt) {
    sections.push(`\n--- Scheduled Resume ---`);
    sections.push(
      `Your subscription will automatically resume on ${formatDate(enrollment.resumeAt, locale.baseName)}.`,
    );
  }

  if (enrollment.expires) {
    sections.push(`Expires: ${formatDate(enrollment.expires, locale.baseName)}`);
  }

  if (reason === 'plan_change') {
    sections.push(`\n--- Plan Change ---`);
    sections.push(`Your subscription plan has been changed to "${productTitle}".`);
    sections.push(`Future billing periods will follow the new plan.`);
  }

  if (enrollment.billingAddress) {
    const addr = enrollment.billingAddress;
    const parts = [
      [addr.firstName, addr.lastName].filter(Boolean).join(' '),
      addr.company,
      addr.addressLine,
      addr.addressLine2,
      [addr.postalCode, addr.city].filter(Boolean).join(' '),
      addr.countryCode,
    ].filter(Boolean);
    if (parts.length) {
      sections.push(`\n--- Billing Address ---`);
      sections.push(parts.join('\n'));
    }
  }

  sections.push(`\n-----------------`);
  sections.push(`View your subscription: ${url}`);
  sections.push(`-----------------`);
  sections.push(`\n${EMAIL_WEBSITE_NAME}: ${EMAIL_WEBSITE_URL}`);

  const text = sections.join('\n');

  return [
    {
      type: 'EMAIL',
      input: {
        from: `${EMAIL_WEBSITE_NAME} <${EMAIL_FROM || 'noreply@unchained.local'}>`,
        to: modules.users.primaryEmail(user)?.address,
        subject,
        text,
      },
    },
  ];
};
