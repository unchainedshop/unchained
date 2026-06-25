import { phoneNumberToParts } from '@unchainedshop/utils';
import type { Order } from '@unchainedshop/core-orders';

export interface Cardholder {
  cardholderName?: string;
  email?: string;
  homePhone?: { cc: string; subscriber: string };
}

// Builds the Datatrans 3DS cardholder data (mandatory consumer data for 3DS
// authentication) from the order's billing address and contact. Empty fields are
// omitted so callers can supply their own values without being overwritten by blanks.
export default function build3DSCardholder(order?: Order): Cardholder | undefined {
  if (!order) return undefined;

  const { billingAddress, contact } = order;

  const cardholderName = [billingAddress?.firstName, billingAddress?.lastName].filter(Boolean).join(' ');
  const homePhone = phoneNumberToParts(contact?.telNumber, billingAddress?.countryCode);

  const cardholder: Cardholder = {};
  if (cardholderName) cardholder.cardholderName = cardholderName;
  if (contact?.emailAddress) cardholder.email = contact.emailAddress;
  if (homePhone) cardholder.homePhone = homePhone;

  if (Object.keys(cardholder).length === 0) return undefined;
  return cardholder;
}

// Merges the order-derived 3DS cardholder data into a container's ['3D'].cardholder.
// Order-derived values act as the base; any caller-supplied cardholder fields take precedence.
const mergeCardholder = (container: any, cardholder: Cardholder) => {
  const threeDS = container?.['3D'] || {};
  return {
    ...container,
    '3D': {
      ...threeDS,
      cardholder: {
        ...cardholder,
        ...(threeDS.cardholder || {}),
      },
    },
  };
};

// The init/redirect endpoint (/v1/transactions) expects the cardholder under card['3D'].cardholder.
export const withCardCardholder = (arbitraryFields: any, cardholder?: Cardholder) => {
  if (!cardholder) return arbitraryFields;
  return {
    ...arbitraryFields,
    card: mergeCardholder(arbitraryFields?.card, cardholder),
  };
};

// The secureFields endpoint (/v1/transactions/secureFields) rejects a `card` property and
// expects the cardholder under a top-level ['3D'].cardholder instead (verified against the
// Datatrans sandbox).
export const withSecureFieldsCardholder = (arbitraryFields: any, cardholder?: Cardholder) => {
  if (!cardholder) return arbitraryFields;
  return mergeCardholder(arbitraryFields, cardholder);
};
