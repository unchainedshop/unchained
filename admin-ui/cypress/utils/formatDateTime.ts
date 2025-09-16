const formatDateTime = (
  locale,
  date,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: 'full',
    timeStyle: 'short',
  },
) => {
  if (!date) return 'n/a';
  try {
    return Intl.DateTimeFormat(locale || 'default', options).format(
      new Date(date).getTime(),
    );
  } catch {
    return Intl.DateTimeFormat('default', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date).getTime());
  }
};

export default formatDateTime;
