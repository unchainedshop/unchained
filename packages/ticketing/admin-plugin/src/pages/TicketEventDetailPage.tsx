import { Loading } from '@unchainedshop/admin-ui/ui';
import TicketEventDetail from '../components/TicketEventDetail.tsx';
import TicketProductionDetail from '../components/production/TicketProductionDetail.tsx';
import useEventProduct from '../hooks/useEventProduct.ts';

// A production (configurable product) shows its dates and categories, anything else is one event.
const TicketEventDetailPage = ({ entityId }) => {
  const { product, loading } = useEventProduct({ slug: entityId as string });

  if (loading) return <Loading />;
  if (product?.__typename === 'ConfigurableProduct') {
    return <TicketProductionDetail productId={product._id} />;
  }
  return <TicketEventDetail product={product} />;
};

export default TicketEventDetailPage;
