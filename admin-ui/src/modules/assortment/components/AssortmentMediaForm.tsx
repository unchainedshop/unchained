import React from 'react';
import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import MediaUploader from '../../common/components/MediaUploader';
import DangerMessage from '../../modal/components/DangerMessage';
import useModal from '../../modal/hooks/useModal';
import useAddAssortmentMedia from '../hooks/useAddAssortmentMedia';

import useAssortmentMedia from '../hooks/useAssortmentMedia';
import useRemoveAssortmentMedia from '../hooks/useRemoveAssortmentMedia';
import useReorderAssortmentMedia from '../hooks/useReorderAssortmentMedia';
import AssortmentMediaList from './AssortmentMediaList';
const AssortmentMediaForm = ({ assortmentId }) => {
  const { assortmentMedia, loading, error } = useAssortmentMedia({
    assortmentId,
  });
  const { formatMessage } = useIntl();
  const { setModal } = useModal();
  const { removeAssortmentMedia } = useRemoveAssortmentMedia();
  const { reorderAssortmentMedia } = useReorderAssortmentMedia();
  const { addAssortmentMedia } = useAddAssortmentMedia();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const items = (assortmentMedia || []).map((media) => media._id);

  if (!MediaUploader || !DndContext || !AssortmentMediaList) {
    console.error('Required components not loaded:', {
      MediaUploader: !!MediaUploader,
      DndContext: !!DndContext,
      AssortmentMediaList: !!AssortmentMediaList,
    });
    return (
      <div className="mx-auto mt-5 max-w-full bg-white dark:bg-slate-800 py-6 shadow-sm dark:shadow-none lg:rounded-sm">
        <div className="flex items-center justify-center p-8">
          <div className="text-rose-500">
            {formatMessage({
              id: 'component_loading_error',
              defaultMessage:
                'Component loading error. Please refresh the page.',
            })}
          </div>
        </div>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="mx-auto mt-5 max-w-full bg-white dark:bg-slate-800 py-6 shadow-sm dark:shadow-none lg:rounded-sm">
        <div className="flex items-center justify-center p-8">
          <div className="text-slate-500 dark:text-slate-400">
            {formatMessage({
              id: 'loading_media',
              defaultMessage: 'Loading media...',
            })}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto mt-5 max-w-full bg-white dark:bg-slate-800 py-6 shadow-sm dark:shadow-none lg:rounded-sm">
        <div className="flex items-center justify-center p-8">
          <div className="text-rose-500">
            {formatMessage({
              id: 'error_loading_media',
              defaultMessage: 'Error loading media: ',
            })}{' '}
            {error.message}
          </div>
        </div>
      </div>
    );
  }

  const onAddMedia = async (media) => {
    try {
      await addAssortmentMedia({ assortmentId, media });
      toast.success(
        formatMessage({
          id: 'assortment_media_upload',
          defaultMessage: 'Media uploaded successfully',
        }),
      );
    } catch (err) {
      toast.error(
        formatMessage({
          id: 'fail_upload',
          defaultMessage: 'Media upload failed',
        }),
      );
    }
  };

  const onRemoveMedia = async (assortmentMediaId) => {
    await setModal(
      <DangerMessage
        onCancelClick={async () => setModal('')}
        message={formatMessage({
          id: 'delete_assortment_media_confirmation',
          defaultMessage:
            'This action might cause inconsistencies with other data that relates to it. Are you sure you want to delete this currency? ',
        })}
        onOkClick={async () => {
          setModal('');
          await removeAssortmentMedia({ assortmentMediaId });
          toast.success(
            formatMessage({
              id: 'assortment_media_deleted',
              defaultMessage: 'Media deleted successfully',
            }),
          );
        }}
        okText={formatMessage({
          id: 'delete_assortment_media',
          defaultMessage: 'Delete media',
        })}
      />,
    );
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = items.indexOf(active.id);
      const newIndex = items.indexOf(over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);

      const sortedItems = newItems.map((id, index) => ({
        assortmentMediaId: id,
        sortKey: index,
      }));

      try {
        await reorderAssortmentMedia({ sortKeys: sortedItems });
        toast.success(
          formatMessage({
            id: 'link_reorder',
            defaultMessage: 'Link reorder successfully',
          }),
        );
      } catch (error) {
        toast.error(
          formatMessage({
            id: 'fail_reorder',
            defaultMessage: 'Reordering failed, Try again!',
          }),
        );
      }
    } else {
      toast.info(
        formatMessage({
          id: 'reorder_original',
          defaultMessage: 'Reorder to original location',
        }),
      );
    }
  };

  return (
    <div className="mx-auto mt-5 max-w-fullpy-6 grid lg:grid-cols-12 gap-5">
      <div className="lg:col-span-6">
        <MediaUploader onlyDragAndDrop addMedia={onAddMedia} />
      </div>

      <div className="lg:col-span-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          id="assortment-media"
        >
          <AssortmentMediaList
            medias={assortmentMedia}
            onDeleteMedia={onRemoveMedia}
            items={items}
          />
        </DndContext>
      </div>
    </div>
  );
};

export default AssortmentMediaForm;
