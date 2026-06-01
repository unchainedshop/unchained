import React from 'react';
import clsx from 'clsx';
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
    <div className={clsx('space-y-4', className)}>
      <div className="flex justify-end">
        <div className="flex bg-surface-raised rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={clsx(
              'p-2 rounded-md transition-colors',
              viewMode === 'grid'
                ? 'bg-surface text-text-primary shadow-sm'
                : 'text-text-muted hover:text-slate-700 dark:hover:text-slate-200',
            )}
          >
            <Squares2X2Icon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={clsx(
              'p-2 rounded-md transition-colors',
              viewMode === 'list'
                ? 'bg-surface text-text-primary shadow-sm'
                : 'text-text-muted hover:text-slate-700 dark:hover:text-slate-200',
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
