import clsx from 'clsx';

const AccordionHeader = ({ name, className = '' }) => {
  if (!name) return null;
  return (
    <div
      aria-description="accordion header"
      className={clsx(
        'mr-4 text-base capitalize font-semibold text-text-muted sm:text-lg sm:font-semibold',
        className,
      )}
    >
      {name}
    </div>
  );
};

export default AccordionHeader;
