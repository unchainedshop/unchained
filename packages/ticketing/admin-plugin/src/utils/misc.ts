export const DefaultLimit = 50;

export const TOKEN_STATUSES = {
  CENTRALIZED: 'sky',
  EXPORTING: 'amber',
  DECENTRALIZED: 'emerald',
};

export const shortenAddress = (fullAddress) => {
  return fullAddress ? `${fullAddress.substr(0, 6)}...${fullAddress.substr(-4, 4)}` : '0x0';
};

export const useFormatPrice = () => {
  const formatPrice = (price: { currencyCode: string; amount: number }) => {
    if (!price?.currencyCode) return 'n/a';
    if (price?.amount === undefined || price?.amount === null) return '';
    const { amount, currencyCode } = price || {};
    return new Intl.NumberFormat(navigator.language, {
      style: 'currency',
      currency: currencyCode,
    }).format(amount / 100);
  };

  return { formatPrice };
};

export const useFormatDateTime = () => {
  const formatDateTime = (date, options: Intl.DateTimeFormatOptions = {}) => {
    if (!date || !Date.parse(date)) return 'n/a';

    return Intl.DateTimeFormat(undefined, options).format(new Date(date).getTime());
  };

  return { formatDateTime };
};

export const generateUniqueId = (params: any = {}) => {
  const { _id, texts } = params || {};
  if (!texts && !_id) return null;
  return `${texts?.slug?.split('/').join('') || ''}_id_${_id}`;
};

export const parseUniqueId = (value) => {
  if (!value) return null;
  const slugAndId = value?.split('_id_');
  return slugAndId?.pop();
};

export const defaultNextImageLoader = ({ src, width, quality = 75 }) => {
  if (src) return `${src}?w=${width}&q=${quality}`;
  return '/no-image.jpg';
};
