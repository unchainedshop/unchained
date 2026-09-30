import { useIntl } from 'react-intl';
import { Loading, PageHeader } from '@unchainedshop/admin-ui/ui';
import TicketEventDetail from '../components/TicketEventDetail.tsx';
import TicketProductionDetail from '../components/production/TicketProductionDetail.tsx';
import useEventProduct from '../hooks/useEventProduct.ts';

// A production (configurable product) shows its dates and categories, anything else is one event.
const TicketEventDetailPage = ({ entityId }) => {
  const { formatMessage } = useIntl();
  const { product, loading } = useEventProduct({ slug: entityId as string });

  if (loading) return <Loading />;

  if (product?.__typename === 'ConfigurableProduct') {
    return <TicketProductionDetail productId={product._id} />;
  }

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
