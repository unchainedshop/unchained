import ImageWithFallback from '../../common/components/ImageWithFallback';
import { IProductMediaFragment } from '../../../gql/types';

interface ProductImageGalleryProps {
  productId: string;
  media: IProductMediaFragment[];
  onEditMedia?: (mediaId: string) => void;
  canEdit?: boolean;
}

const ProductImageGallery = ({
  media = [],
  onEditMedia,
}: ProductImageGalleryProps) => {
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
              className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden cursor-pointer border border-slate-200 dark:border-slate-700"
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

export default ProductImageGallery;
