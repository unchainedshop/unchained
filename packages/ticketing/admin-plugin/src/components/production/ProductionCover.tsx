import { useState } from 'react';
import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import { ImageWithFallback } from '@unchainedshop/admin-ui/ui';
import { useAddProductMedia, useRemoveProductMedia } from '@unchainedshop/admin-ui/modules/product';
import { useApolloClient } from '@apollo/client/react';
import { defaultNextImageLoader } from '../../utils/misc.ts';
import { SectionTitle, dangerButtonClassName, errorMessage, inputClassName } from './fields.tsx';

/**
 * Images of the production. The engine shares them with every date (same file), so they are only
 * added and removed here, never on a date.
 */
const ProductionCover = ({ production }: { production: any }) => {
  const { formatMessage } = useIntl();
  const client = useApolloClient();
  const { addProductMedia } = useAddProductMedia();
  const { removeProductMedia } = useRemoveProductMedia();
  const [uploading, setUploading] = useState(false);

  const refetch = () => client.refetchQueries({ include: ['TicketProductionDetail'] });

  const onUpload = async (e) => {
    const [file] = e.target.files || [];
    if (!file) return;
    setUploading(true);
    try {
      await addProductMedia({ productId: production._id, media: file });
      await refetch();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const onRemove = async (productMediaId: string) => {
    try {
      await removeProductMedia({ productMediaId });
      await refetch();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <section className="rounded-md border border-border-default bg-surface p-5">
      <SectionTitle>{formatMessage({ id: 'production_images', defaultMessage: 'Images' })}</SectionTitle>
      <div className="space-y-3">
        {(production.media ?? []).map((media) => (
          <div key={media._id} className="flex items-center gap-3">
            <div className="h-16 w-16 overflow-hidden rounded-md bg-surface-raised">
              <ImageWithFallback
                src={media.file?.url || '/no-image.jpg'}
                loader={defaultNextImageLoader}
                alt={media.file?.name || ''}
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            </div>
            <span className="min-w-0 flex-1 truncate text-sm text-text-secondary">
              {media.file?.name}
            </span>
            <button type="button" className={dangerButtonClassName} onClick={() => onRemove(media._id)}>
              {formatMessage({ id: 'remove', defaultMessage: 'Remove' })}
            </button>
          </div>
        ))}
        <label className="block text-sm font-medium text-text-secondary">
          {formatMessage({ id: 'production_image_add', defaultMessage: 'Add image' })}
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={onUpload}
            className={inputClassName}
          />
        </label>
      </div>
    </section>
  );
};

export default ProductionCover;
