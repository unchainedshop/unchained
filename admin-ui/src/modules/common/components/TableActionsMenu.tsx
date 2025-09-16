import React, { useState, useEffect, useRef } from 'react';
import { useIntl } from 'react-intl';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import { PencilIcon, TrashIcon } from '@heroicons/react/20/solid';
import Portal from './Portal';

export interface TableActionsMenuProps {
  onEdit?: () => void;
  onDelete?: () => void;
  editLabel?: string;
  deleteLabel?: string;
  showEdit?: boolean;
  showDelete?: boolean;
}

const TableActionsMenu: React.FC<TableActionsMenuProps> = ({
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
  showEdit = true,
  showDelete = true,
}) => {
  const { formatMessage } = useIntl();
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Calculate menu position when showing menu
  const calculateMenuPosition = () => {
    if (!buttonRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const menuWidth = 192; // w-48 = 12rem = 192px
    const menuHeight = 80; // Approximate height for 2 menu items

    let top = buttonRect.bottom + 4; // 4px gap (mt-1)
    let left = buttonRect.right - menuWidth; // Align right edge with button

    // Ensure menu doesn't go off screen
    if (left < 8) left = 8; // 8px from left edge
    if (top + menuHeight > window.innerHeight - 8) {
      top = buttonRect.top - menuHeight - 4; // Show above button
    }

    setMenuPosition({ top, left });
  };

  const handleButtonClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    if (!showMenu) {
      calculateMenuPosition();
    }
    setShowMenu(!showMenu);
  };

  const handleMenuItemClick = (
    event: React.MouseEvent,
    action?: () => void,
  ) => {
    event.stopPropagation();
    event.preventDefault();
    if (action) {
      action();
    }
    setShowMenu(false);
  };

  // Count how many actions are available
  const actionCount = [showEdit && onEdit, showDelete && onDelete].filter(
    Boolean,
  ).length;

  // Don't render if no actions are available
  if (actionCount === 0) return null;

  return (
    <div className="flex justify-end w-full">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleButtonClick}
        className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        aria-label={formatMessage({
          id: 'table_actions_menu',
          defaultMessage: 'Actions menu',
        })}
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
            }}
          >
            <div className="py-1">
              {showEdit && onEdit && (
                <button
                  type="button"
                  onClick={(e) => handleMenuItemClick(e, onEdit)}
                  className="flex items-center w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <PencilIcon className="mr-3 h-5 w-5" />
                  {editLabel ||
                    formatMessage({
                      id: 'edit',
                      defaultMessage: 'Edit',
                    })}
                </button>
              )}
              {showDelete && onDelete && (
                <button
                  type="button"
                  onClick={(e) => handleMenuItemClick(e, onDelete)}
                  className="flex items-center w-full px-4 py-2 text-sm text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                >
                  <TrashIcon className="mr-3 h-5 w-5" />
                  {deleteLabel ||
                    formatMessage({
                      id: 'delete',
                      defaultMessage: 'Delete',
                    })}
                </button>
              )}
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};

export default TableActionsMenu;
