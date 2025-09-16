import React from 'react';
import AssortmentMediaForm from './AssortmentMediaForm';

// Import all dependencies to validate them
import MediaUploader from '../../common/components/MediaUploader';
import DangerMessage from '../../modal/components/DangerMessage';
import useModal from '../../modal/hooks/useModal';
import useAddAssortmentMedia from '../hooks/useAddAssortmentMedia';
import useAssortmentMedia from '../hooks/useAssortmentMedia';
import useRemoveAssortmentMedia from '../hooks/useRemoveAssortmentMedia';
import useReorderAssortmentMedia from '../hooks/useReorderAssortmentMedia';
import AssortmentMediaList from './AssortmentMediaList';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';

interface SafeAssortmentMediaFormProps {
  assortmentId: string;
}

const SafeAssortmentMediaForm: React.FC<SafeAssortmentMediaFormProps> = (
  props,
) => {
  // Validate all dependencies before rendering
  const dependencies = {
    MediaUploader,
    DangerMessage,
    useModal,
    useAddAssortmentMedia,
    useAssortmentMedia,
    useRemoveAssortmentMedia,
    useReorderAssortmentMedia,
    AssortmentMediaList,
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    arrayMove,
    sortableKeyboardCoordinates,
  };

  const missingDependencies = Object.entries(dependencies)
    .filter(([name, dep]) => !dep)
    .map(([name]) => name);

  if (missingDependencies.length > 0) {
    console.error(
      'Missing dependencies in AssortmentMediaForm:',
      missingDependencies,
    );
    return (
      <div className="mx-auto mt-5 max-w-full bg-white dark:bg-slate-800 py-6 shadow-sm dark:shadow-none lg:rounded-sm">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-rose-500 mb-2">Missing Dependencies</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              The following dependencies are missing:{' '}
              {missingDependencies.join(', ')}
            </div>
          </div>
        </div>
      </div>
    );
  }

  try {
    return <AssortmentMediaForm {...props} />;
  } catch (error) {
    console.error('Error rendering AssortmentMediaForm:', error);
    return (
      <div className="mx-auto mt-5 max-w-full bg-white dark:bg-slate-800 py-6 shadow-sm dark:shadow-none lg:rounded-sm">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-rose-500 mb-2">Component Error</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {error instanceof Error
                ? error.message
                : 'Unknown error occurred'}
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default SafeAssortmentMediaForm;
