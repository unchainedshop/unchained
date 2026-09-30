import { buyerContact } from '../utils/attendees.ts';

/**
 * The buyer e-mail and phone as links, for viewers with viewUserContactInfos (the queries only
 * load them then); nothing otherwise.
 */
const BuyerContact = ({ user, className = '' }: { user: any; className?: string }) => {
  const { email, phone } = buyerContact(user);
  if (!email && !phone) return null;
  return (
    <span className={`flex min-w-0 flex-col break-all text-sm text-text-muted ${className}`}>
      {email && (
        <a href={`mailto:${email}`} className="hover:underline">
          {email}
        </a>
      )}
      {phone && (
        <a href={`tel:${phone.replace(/\s+/g, '')}`} className="hover:underline">
          {phone}
        </a>
      )}
    </span>
  );
};

export default BuyerContact;
