import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/20/solid';
import classNames from 'classnames';
import { useState } from 'react';

const AccordionItem = ({
  header,
  body,
  headerCSS = '',
  bodyCSS = '',
  itemContainerCSS = '',
  itemindex = 1,
  hideChevron = false,
}) => {
  const [show, setShow] = useState(false);
  return (
    <div
      className={classNames('mt-3', itemContainerCSS)}
      data-itemindex={itemindex}
    >
      <button
        type="button"
        onClick={() => setShow(!show)}
        className={classNames(
          'relative cursor-pointer border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 w-full max-w-full overflow-hidden',
          headerCSS,
        )}
      >
        <div className="w-full">{header}</div>
        {!hideChevron && (
          <span className="px-2">
            {show ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </span>
        )}
      </button>

      {show ? (
        <div
          className={classNames(
            'rounded-lg sm:p-4 xl:p-10 relative overflow-visible',
            bodyCSS,
          )}
        >
          {body}
        </div>
      ) : (
        ''
      )}
    </div>
  );
};

export default AccordionItem;
