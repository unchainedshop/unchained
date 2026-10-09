import { useState } from 'react';
import { useIntl } from 'react-intl';
import { IRoleAction } from '../../../gql/types';

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
import MediaPicker from '../../media/components/MediaPicker';
import useAddProductMedia from '../hooks/useAddProductMedia';
import useLinkProductMedia from '../hooks/useLinkProductMedia';
import useProductMedia from '../hooks/useProductMedia';

import ProductMediaList from './ProductMediaList';
import useReOrderProductMedia from '../hooks/useReOrderProductMedia';
import useAuth from '../../Auth/useAuth';

const ProductMediaForm = ({ productId }) => {
  const { productMedia } = useProductMedia({ productId });
  const { formatMessage } = useIntl();
  const { hasRole } = useAuth();
  const { addProductMedia } = useAddProductMedia();
  const { linkProductMedia } = useLinkProductMedia();
  const { reOrderProductMedia } = useReOrderProductMedia();
  const [pickerOpen, setPickerOpen] = useState(false);
  const items = productMedia?.map((media) => media._id);

  const onAddMedia = async (media) => {
    try {
      await addProductMedia({ productId, media });
      toast.success(
        formatMessage({
          id: 'product_media_upload',
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

  const onLinkMedia = async (media) => {
    try {
      await linkProductMedia({ productId, mediaId: media._id });
      toast.success(
        formatMessage({
          id: 'product_media_linked',
          defaultMessage: 'Media linked successfully',
        }),
      );
    } catch (err) {
      toast.error(
        formatMessage({
          id: 'fail_link_media',
          defaultMessage: 'Failed to link media',
        }),
      );
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = items.indexOf(active.id);
      const newIndex = items.indexOf(over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);

      const sortedItems = newItems.map((id, index) => ({
        productMediaId: id,
        sortKey: index,
      }));

      try {
        await reOrderProductMedia({ sortKeys: sortedItems });
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

  return (
    <div className="mx-auto mt-5 space-y-5 lg:space-y-0 max-w-full py-6 lg:grid lg:grid-cols-12 lg:gap-4">
      {hasRole(IRoleAction.ManageProducts) && (
        <div className="mx-auto w-full px-6 lg:col-span-6 lg:col-start-1 space-y-3">
          <MediaUploader onlyDragAndDrop addMedia={onAddMedia} />
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="w-full rounded-md border border-border-default bg-white dark:bg-slate-600 py-2 px-3 text-sm font-medium text-text-secondary shadow-xs hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-focus-ring focus:ring-offset-2"
          >
            {formatMessage({
              id: 'select_from_library',
              defaultMessage: 'Select from media library',
            })}
          </button>
          <MediaPicker
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            onSelect={onLinkMedia}
          />
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <ProductMediaList medias={productMedia} items={items} />
      </DndContext>
    </div>
  );
};

export default ProductMediaForm;
