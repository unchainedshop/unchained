import { useIntl } from 'react-intl';

const StatusInformation = ({
  enumType,
  currentType,
  label,
  component = null,
}) => {
  const { formatMessage } = useIntl();

  const getTranslatedType = (type) => {
    switch (type) {
      case 'INVOICE':
        return formatMessage({ id: 'invoice', defaultMessage: 'INVOICE' });
      case 'SHIPPING':
        return formatMessage({
          id: 'shipping_method',
          defaultMessage: 'SHIPPING',
        });
      case 'OPEN':
        return formatMessage({ id: 'open', defaultMessage: 'OPEN' });
      case 'DELIVERED':
        return formatMessage({
          id: 'delivered',
          defaultMessage: 'Delivered',
        }).toUpperCase();
      case 'PAID':
        return formatMessage({
          id: 'paid',
          defaultMessage: 'Paid',
        }).toUpperCase();
      default:
        return type;
    }
  };

  return (
    component || (
      <span
        title={label}
        className={`${
          currentType === enumType
            ? 'border-slate-300 bg-slate-200 text-slate-950 dark:bg-slate-800 dark:text-slate-200'
            : 'opacity-10 dark:bg-slate-900 '
        } mr-2 mb-2 inline-flex items-center rounded-md border border-slate-300 bg-white px-2 py-1 text-sm uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors duration-200 ease-in-out hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-hidden focus:ring-2 focus:ring-slate-800 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800`}
      >
        {getTranslatedType(enumType)}
      </span>
    )
  );
};

export default StatusInformation;
