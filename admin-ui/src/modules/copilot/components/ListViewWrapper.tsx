import React from 'react';
import classNames from 'classnames';
import { Squares2X2Icon, ListBulletIcon } from '@heroicons/react/24/outline';
import useLocalStorage from '../../common/hooks/useLocalStorage';

type ViewMode = 'grid' | 'list';

interface ListViewWrapperProps {
  storageKey?: string;
  className?: string;
  children: (viewMode: ViewMode) => React.ReactNode;
}

const ListViewWrapper: React.FC<ListViewWrapperProps> = ({
  storageKey = 'listViewMode',
  className,
  children,
}) => {
  const [viewMode, setViewMode] = useLocalStorage(storageKey, 'list');

  return (
    <div className={classNames('space-y-4', className)}>
      <div className="flex justify-end">
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={classNames(
              'p-2 rounded-md transition-colors',
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
            )}
          >
            <Squares2X2Icon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={classNames(
              'p-2 rounded-md transition-colors',
              viewMode === 'list'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
            )}
          >
            <ListBulletIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      {children(viewMode)}
    </div>
  );
};

export default ListViewWrapper;
