import ImageWithFallback from '@/components/ui/ImageWithFallback';
import { IAssortmentMediaFragment } from '../../../gql/types';

interface AssortmentImageGalleryProps {
  assortmentId: string;
  media: IAssortmentMediaFragment[];
  onEditMedia?: (mediaId: string) => void;
  canEdit?: boolean;
}

const AssortmentImageGallery = ({
  media = [],
  onEditMedia,
}: AssortmentImageGalleryProps) => {
  const handleImageClick = (mediaId: string) => {
    if (onEditMedia) {
      onEditMedia(mediaId);
    }
  };

  return (
    <div className="my-5">
      <div className="flex gap-3 overflow-x-auto">
        {media.map((item) => (
          <div key={item._id} className="relative flex-shrink-0 group">
            <div
              className="w-16 h-16 bg-surface-raised rounded-lg overflow-hidden cursor-pointer border border-border-subtle"
              onClick={() => handleImageClick(item._id)}
            >
              <ImageWithFallback
                src={item?.file?.url}
                alt={item.texts?.[0]?.title || item?.file?.url}
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssortmentImageGallery;
