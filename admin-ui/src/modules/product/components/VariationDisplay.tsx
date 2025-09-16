import { useState } from 'react';
import { useIntl } from 'react-intl';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import Badge from '../../common/components/Badge';
import Portal from '../../common/components/Portal';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/20/solid';
import { useMenuPosition } from '../hooks/useMenuPosition';

const VariationDisplay = ({ type, variation, onEdit, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const { formatMessage } = useIntl();
  const { buttonRef, menuRef, menuPosition } = useMenuPosition(
    showMenu,
    setShowMenu,
  );

  return (
    <div className="variation-display bg-white dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-700 w-full overflow-x-hidden overflow-y-visible relative hover:outline hover:outline-2 hover:outline-slate-400 dark:hover:outline-slate-500 transition-all">
      <div
        className="flex items-center justify-between w-full gap-4"
        tabIndex={-1}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0 overflow-hidden">
          <div className="flex-shrink-0 text-lg font-semibold text-slate-900 dark:text-slate-200 truncate">
            {variation?.texts?.title}
          </div>

          {type && (
            <Badge
              text={type}
              color="slate"
              className="rounded-md uppercase text-xs font-medium flex-shrink-0"
            />
          )}

          {variation?.texts?.subtitle && (
            <div className="text-sm text-slate-500 dark:text-slate-400 truncate">
              {variation?.texts?.subtitle}
            </div>
          )}

          {variation?.options?.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {variation.options.map((option, index) => (
                <span
                  key={option.value || index}
                  className="inline-flex text-nowrap items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800"
                >
                  {option?.texts?.title || option.value}
                </span>
              ))}
            </div>
          )}

          <div className="text-sm text-slate-400 dark:text-slate-500 font-mono flex-shrink-0">
            ({variation?.key})
          </div>
        </div>

        <div className="relative flex-shrink-0">
          <button
            ref={buttonRef}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              event.preventDefault();
              setShowMenu((prev) => !prev);
            }}
            className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <EllipsisHorizontalIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>

          {showMenu && (
            <Portal>
              <div
                ref={menuRef}
                className="fixed w-48 bg-white dark:bg-slate-800 rounded-md shadow-xl border border-slate-200 dark:border-slate-700 z-[9999]"
                style={{
                  top: menuPosition.top,
                  left: menuPosition.left,
                  boxShadow:
                    '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                }}
              >
                <div className="py-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onEdit();
                      setShowMenu(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <PencilSquareIcon className="mr-3 h-5 w-5" />
                    {formatMessage({ id: 'edit', defaultMessage: 'Edit' })}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onDelete(variation._id);
                      setShowMenu(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                  >
                    <TrashIcon className="mr-3 h-5 w-5" />
                    {formatMessage({ id: 'delete', defaultMessage: 'Delete' })}
                  </button>
                </div>
              </div>
            </Portal>
          )}
        </div>
      </div>
    </div>
  );
};

export default VariationDisplay;
