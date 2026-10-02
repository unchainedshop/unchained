import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useApp } from '@unchainedshop/admin-ui/hooks';

// DateTime arguments are served as the DateTimeISO scalar, so the variables are declared as such.
const TicketSalesReportQuery = gql`
  query TicketSalesReport($from: DateTimeISO!, $to: DateTimeISO!, $forceLocale: Locale) {
    ticketSalesReport(from: $from, to: $to, forceLocale: $forceLocale) {
      from
      to
      totals {
        currencyCode
        orders
        tickets
        items
        discounts
        total
      }
      performances {
        productId
        title
        startsAt
        categoryTitle
        currencyCode
        tickets
        items
        discounts
      }
      paymentProviders {
        paymentProviderId
        adapterKey
        currencyCode
        orders
        tickets
        total
      }
      orders {
        orderId
        orderNumber
        ordered
        emailAddress
        telNumber
        billingName
        paymentProviderId
        paymentAdapterKey
        currencyCode
        tickets
        items
        discounts
        delivery
        payment
        total
      }
    }
  }
`;

/** The ticket sales of a period, titles in the language selected in the Admin UI. */
const useTicketSalesReport = ({ from, to }: { from?: Date | null; to?: Date | null }) => {
  const { selectedLocale } = useApp();
  const { data, previousData, loading, error, refetch } = useQuery<any>(TicketSalesReportQuery, {
    variables: { from: from?.toISOString(), to: to?.toISOString(), forceLocale: selectedLocale },
    skip: !from || !to,
    fetchPolicy: 'network-only',
  });

  return {
    report: data?.ticketSalesReport || (loading ? previousData?.ticketSalesReport : null) || null,
    loading,
    error,
    refetch,
  };
};

export default useTicketSalesReport;
