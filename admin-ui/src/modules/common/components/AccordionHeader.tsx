import classNames from 'classnames';

const AccordionHeader = ({ name, className = '' }) => {
  if (!name) return null;
  return (
    <div
      aria-description="accordion header"
      className={classNames(
        'mr-4 text-base capitalize font-semibold text-slate-500 dark:text-slate-200 sm:text-lg sm:font-semibold',
        className,
      )}
    >
      {name}
    </div>
  );
};

export default AccordionHeader;
