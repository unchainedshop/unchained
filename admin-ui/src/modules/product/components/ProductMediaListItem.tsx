import React, { useState } from 'react';
import MediaListItem from '../../common/components/MediaListItem';

import useTranslatedProductMediaTexts from '../hooks/useTranslatedProductMediaTexts';
import useUpdateProductMediaTexts from '../hooks/useUpdateProductMediaTexts';
import useApp from '../../common/hooks/useApp';

const ProductMediaListItem = ({ media, onDelete, id }) => {
  const { selectedLocale } = useApp();
  const { updateProductMediaTexts } = useUpdateProductMediaTexts();
  const [isEditing, setIsEditing] = useState(false);
  const { translatedMediaTexts } = useTranslatedProductMediaTexts({
    productMediaId: media._id,
  });
  const mediaText =
    translatedMediaTexts?.find((text) => text.locale === selectedLocale) || {};

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
      onDelete={onDelete}
      onEdit={setIsEditing}
      onUpdate={onUpdateMediaText}
    />
  );
};

export default ProductMediaListItem;
