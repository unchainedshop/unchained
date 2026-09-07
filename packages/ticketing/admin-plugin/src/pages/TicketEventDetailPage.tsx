import { useIntl } from 'react-intl';
import { Loading, PageHeader } from '@unchainedshop/admin-ui/ui';
import TicketEventDetail from '../components/TicketEventDetail';
import useEventProduct from '../hooks/useEventProduct';

const TicketEventDetailPage = ({ entityId }) => {
  const { formatMessage } = useIntl();
  const { product, loading } = useEventProduct({ slug: entityId as string });

  if (loading) return <Loading />;

  return (
    <>
      <PageHeader
        headerText={formatMessage(
          {
            id: 'event_detail_title',
            defaultMessage: 'Event: {title}',
          },
          { title: product?.texts?.title || entityId },
        )}
      />
      <TicketEventDetail product={product} />
    </>
  );
};

export default TicketEventDetailPage;
