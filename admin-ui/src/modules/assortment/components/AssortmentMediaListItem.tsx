import React, { useState } from 'react';
import MediaListItem from '../../common/components/MediaListItem';
import useTranslatedAssortmentMediaTexts from '../hooks/useTranslatedAssortmentMediaTexts';
import useUpdateAssortmentMediaTexts from '../hooks/useUpdateAssortmentMediaTexts';

const AssortmentMediaListItem = ({ media, onDelete, locale, id }) => {
  const [isEditing, setIsEditing] = useState(false);
  const { updateAssortmentMediaTexts } = useUpdateAssortmentMediaTexts();
  const { translatedAssortmentMediaTexts } = useTranslatedAssortmentMediaTexts({
    assortmentMediaId: media._id,
  });

  const mediaText =
    translatedAssortmentMediaTexts?.find((text) => text.locale === locale) ||
    {};

  const onUpdateMediaText = async ({ title, subtitle }) => {
    await updateAssortmentMediaTexts({
      assortmentMediaId: media._id,
      texts: [
        {
          title,
          locale,
          subtitle,
        },
      ],
    });
    setIsEditing(false);
    return true;
  };

  return (
    <MediaListItem
      media={media}
      mediaText={mediaText}
      isEdit={isEditing}
      onDelete={onDelete}
      onEdit={setIsEditing}
      onUpdate={onUpdateMediaText}
      id={id}
    />
  );
};

export default AssortmentMediaListItem;
