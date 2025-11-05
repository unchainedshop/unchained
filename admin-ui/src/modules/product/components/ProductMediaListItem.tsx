import React, { useState } from 'react';
import MediaListItem from '../../common/components/MediaListItem';
import useTranslatedProductMediaTexts from '../hooks/useTranslatedProductMediaTexts';
import useUpdateProductMediaTexts from '../hooks/useUpdateProductMediaTexts';
import useApp from '../../common/hooks/useApp';
import useAuth from '../../Auth/useAuth';
import DangerMessage from '../../modal/components/DangerMessage';
import useRemoveProductMedia from '../hooks/useRemoveProductMedia';
import useModal from '../../modal/hooks/useModal';
import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';

const ProductMediaListItem = ({ media, id }) => {
  const { setModal } = useModal();
  const { removeProductMedia } = useRemoveProductMedia();
  const { formatMessage } = useIntl();
  const { selectedLocale } = useApp();
  const { updateProductMediaTexts } = useUpdateProductMediaTexts();
  const [isEditing, setIsEditing] = useState(false);
  const { hasRole } = useAuth();
  const { translatedMediaTexts } = useTranslatedProductMediaTexts({
    productMediaId: media._id,
  });
  const mediaText =
    translatedMediaTexts?.find((text) => text.locale === selectedLocale) || {};

  const onDelete = async (productMediaId) => {
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

  const onUpdateMediaText = async ({ title, subtitle }) => {
    await updateProductMediaTexts({
      productMediaId: media._id,
      texts: [
        {
          title,
          locale: selectedLocale,
          subtitle,
        },
      ],
    });
    setIsEditing(false);
    return true;
  };

  return (
    <MediaListItem
      id={id}
      media={media}
      mediaText={mediaText}
      isEdit={isEditing}
      onDelete={hasRole('manageProducts') ? onDelete : undefined}
      onEdit={hasRole('manageProducts') ? setIsEditing : undefined}
      onUpdate={hasRole('manageProducts') ? onUpdateMediaText : undefined}
    />
  );
};

export default ProductMediaListItem;
