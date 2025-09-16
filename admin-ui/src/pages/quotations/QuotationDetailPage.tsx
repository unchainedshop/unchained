import { useIntl } from 'react-intl';

import BreadCrumbs from '../../modules/common/components/BreadCrumbs';
import Loading from '../../modules/common/components/Loading';
import PageHeader from '../../modules/common/components/PageHeader';
import QuotationDetail from '../../modules/quotation/components/QuotationDetail';
import useQuotation from '../../modules/quotation/hooks/useQuotation';

const QuotationDetailPage = ({ quotationId }) => {
  const { formatMessage } = useIntl();

  const { quotation, loading } = useQuotation({
    quotationId: quotationId as string,
  });

  return (
    <div className="mt-5 max-w-full">
      <BreadCrumbs currentPageTitle={quotation?.quotationNumber ?? ''} />
      <div className="items-center flex min-w-full justify-between gap-3 flex-wrap">
        <PageHeader
          headerText={formatMessage({
            id: 'quotation_detail',
            defaultMessage: 'Quotation Detail',
          })}
          title={formatMessage(
            {
              id: 'quotation_detail_title',
              defaultMessage: 'Quotation {id}',
            },
            {
              id: quotation?._id,
            },
          )}
        />
      </div>
      {/* TODO change mock props data */}
      {loading ? <Loading /> : <QuotationDetail quotation={quotation} />}
    </div>
  );
};

export default QuotationDetailPage;
