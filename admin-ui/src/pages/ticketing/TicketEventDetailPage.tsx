import { useIntl } from 'react-intl';
import BreadCrumbs from '../../components/ui/BreadCrumbs';
import PageHeader from '../../components/ui/PageHeader';
import Loading from '../../components/ui/Loading';
import TicketEventDetail from '../../modules/ticketing/components/TicketEventDetail';
import useProduct from '../../modules/product/hooks/useProduct';

const TicketEventDetailPage = ({ slug }) => {
  const { formatMessage } = useIntl();
  const { product, loading } = useProduct({ slug: slug as string });

  if (loading) return <Loading />;

  return (
    <>
      <BreadCrumbs currentPageTitle={product?.texts?.title || slug} />
      <div className="items-center flex min-w-full justify-between gap-3 flex-wrap">
        <PageHeader
          headerText={formatMessage(
            {
              id: 'event_detail_title',
              defaultMessage: 'Event: {title}',
            },
            { title: product?.texts?.title || slug },
          )}
        />
      </div>
      <TicketEventDetail product={product} />
    </>
  );
};

export default TicketEventDetailPage;
