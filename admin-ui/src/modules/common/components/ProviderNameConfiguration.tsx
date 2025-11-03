import Badge from './Badge';

const ProviderNameConfiguration = ({ configuration, color }) => {
  let normalizedJSON = null;
  try {
    if (configuration) normalizedJSON = JSON.parse(configuration);
  } catch (e) {
    normalizedJSON = configuration;
  }

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <div className="flex flex-wrap">
      {normalizedJSON &&
        normalizedJSON.map((config) => {
          const text = `${config.key} | ${formatValue(config.value)}`;
          const displayText =
            text.length > 20 ? `${text.slice(0, 20)}...` : text;

          return (
            <Badge
              key={`${config.key}-${JSON.stringify(config.value)}`}
              text={displayText}
              color={color}
              square
              className="px-1.5 py-0 mr-2 my-1"
            />
          );
        })}
    </div>
  );
};

export default ProviderNameConfiguration;
