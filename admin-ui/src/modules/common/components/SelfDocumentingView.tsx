import classNames from 'classnames';

const SelfDocumentingView = ({
  documentationLabel,
  documentation = null,
  mainContent = null,
  sideComponents = null,
  className = null,
  children,
}) => {
  return (
    <>
      <div
        className={classNames(
          'mt-5 lg:grid lg:grid-cols-3 lg:gap-6',
          className,
        )}
      >
        <div className="lg:col-span-1 mt-10 lg:mt-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg text-slate-900 dark:text-slate-200">
              {documentationLabel}
            </h3>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-500">
              {documentation}
            </div>
            {sideComponents}
          </div>
        </div>
        <div className="lg:col-span-2 lg:mt-0">{children || mainContent}</div>
      </div>
    </>
  );
};

export default SelfDocumentingView;
