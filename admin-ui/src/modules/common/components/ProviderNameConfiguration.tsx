import Badge from './Badge';

const ProviderNameConfiguration = ({ configuration, color }) => {
  return (
    <div className="flex flex-wrap">
      {configuration &&
        configuration.map((config) => (
          <Badge
            key={`${config.key} ${config.value}`}
            text={
              `${config.key} | ${config.value}`?.length > 20
                ? `${config.key} | ${config.value}`?.slice(0, 20)?.concat('...')
                : `${config.key} | ${config.value}`
            }
            color={color}
            square
            className="px-1.5 py-0 mr-2 my-1"
          />
        ))}
    </div>
  );
};

export default ProviderNameConfiguration;
