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
import useAddProductMedia from '../hooks/useAddProductMedia';
import useProductMedia from '../hooks/useProductMedia';
import useRemoveProductMedia from '../hooks/useRemoveProductMedia';

import ProductMediaList from './ProductMediaList';
import useReOrderProductMedia from '../hooks/useReOrderProductMedia';

const ProductMediaForm = ({ productId }) => {
  const { productMedia } = useProductMedia({ productId });
  const { setModal } = useModal();
  const { formatMessage } = useIntl();

  const { removeProductMedia } = useRemoveProductMedia();
  const { addProductMedia } = useAddProductMedia();
  const { reOrderProductMedia } = useReOrderProductMedia();
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

  const onRemoveMedia = async (productMediaId) => {
    await setModal(
      <DangerMessage
        onCancelClick={async () => setModal('')}
        message={formatMessage({
          id: 'delete_product_media_confirmation',
          defaultMessage:
            'This action might cause inconsistencies with other data that relates to it. Are you sure you want to delete this media? ',
        })}
        onOkClick={async () => {
          setModal('');
          await removeProductMedia({ productMediaId });
          toast.success(
            formatMessage({
              id: 'product_media_deleted',
              defaultMessage: 'Media deleted successfully',
            }),
          );
        }}
        okText={formatMessage({
          id: 'delete_product_media',
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
      <div className="mx-auto w-full px-6 lg:col-span-6 lg:col-start-1">
        <MediaUploader onlyDragAndDrop addMedia={onAddMedia} />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <ProductMediaList
          medias={productMedia}
          onDeleteMedia={onRemoveMedia}
          items={items}
        />
      </DndContext>
    </div>
  );
};

export default ProductMediaForm;
