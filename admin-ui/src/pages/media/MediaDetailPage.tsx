import { useIntl } from 'react-intl';
import BreadCrumbs from '@/components/ui/BreadCrumbs';
import Loading from '@/components/ui/Loading';
import PageHeader from '@/components/ui/PageHeader';
import MediaDetail from '../../modules/media/components/MediaDetail';
import useMedia from '../../modules/media/hooks/useMedia';

const MediaDetailPage = ({ mediaId }) => {
  const { formatMessage } = useIntl();

  const { media, loading } = useMedia({ mediaId: mediaId as string });

  return (
    <div className="mt-5 max-w-full">
      <BreadCrumbs />
      <PageHeader
        headerText={formatMessage({
          id: 'media_detail',
          defaultMessage: 'Media Detail',
        })}
        title={formatMessage(
          {
            id: 'media_detail_title',
            defaultMessage: 'Media {name}',
          },
          { name: media?.name || mediaId },
        )}
      />
      {loading ? <Loading variant="detail" /> : media && <MediaDetail media={media} />}
    </div>
  );
};

export default MediaDetailPage;
