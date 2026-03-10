import { useIntl } from 'react-intl';
import BreadCrumbs from '../../modules/common/components/BreadCrumbs';
import PageHeader from '../../modules/common/components/PageHeader';
import Loading from '../../modules/common/components/Loading';
import TicketEventDetail from '../../modules/ticketing/components/TicketEventDetail';
import useProduct from '../../modules/product/hooks/useProduct';

const TicketEventDetailPage = ({ slug }) => {
  const { formatMessage } = useIntl();
  const { product, loading } = useProduct({ slug: slug as string });

  if (loading) return <Loading />;

  return (
    <>
      <BreadCrumbs
        currentPageTitle={product?.texts?.title || slug}
      />
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
