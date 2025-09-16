import Link from 'next/link';
import { useIntl } from 'react-intl';

import { PaperAirplaneIcon, XCircleIcon } from '@heroicons/react/24/outline';
import StatusProgress from '../../common/components/StatusProgress';
import useQuotationStatusTypes from '../hooks/useQuotationStatusTypes';
import Button from '../../common/components/Button';
import useModal from '../../modal/hooks/useModal';

import useVerifyQuotation from '../hooks/useVerifyQuotation';

import QuotationDetailHeader from './QuotationDetailHeader';
import useRejectQuotation from '../hooks/useRejectQuotation';
import generateUniqueId from '../../common/utils/getUniqueId';
import QuotationConfigurationForm from './QuotationConfigurationForm';
import useMakeQuotationProposal from '../hooks/useMakeQuotationProposal';
import JSONView from '../../common/components/JSONView';
import ImageWithFallback from '../../common/components/ImageWithFallback';

const QuotationDetail = ({ quotation }) => {
  const { formatMessage } = useIntl();
  const { setModal } = useModal();

  const { quotationStatusTypes } = useQuotationStatusTypes();
  const { VerifyQuotation } = useVerifyQuotation();
  const { rejectQuotation } = useRejectQuotation();
  const { makeQuotationProposal } = useMakeQuotationProposal();
  if (!quotation) return null;

  const onVerify = async () => {
    await setModal(
      <QuotationConfigurationForm
        onSubmit={async ({ quotationContext }) => {
          await VerifyQuotation({
            quotationId: quotation?._id,
            quotationContext: quotationContext
              ? JSON.parse(quotationContext || null)
              : null,
          });

          setModal('');
        }}
        onCancel={() => setModal('')}
        successMessage={formatMessage({
          id: 'quotation-verified-successfully',
          defaultMessage: 'Quotation verified successfully',
        })}
        submitButtonText={formatMessage({
          id: 'verify-quotation-submit',
          defaultMessage: 'Verify',
        })}
        headerText={formatMessage({
          id: 'verify-quotation-quotation',
          defaultMessage: 'Verify quotation?',
        })}
      />,
    );
  };

  const onReject = async () => {
    await setModal(
      <QuotationConfigurationForm
        onSubmit={async ({ quotationContext }) => {
          await rejectQuotation({
            quotationId: quotation?._id,
            quotationContext: quotationContext
              ? JSON.parse(quotationContext || null)
              : null,
          });
          setModal('');
        }}
        onCancel={() => setModal('')}
        successMessage={formatMessage({
          id: 'quotation-rejection-successfully',
          defaultMessage: 'Quotation rejected successfully',
        })}
        headerText={formatMessage({
          id: 'reject-quotation-quotation',
          defaultMessage: 'Reject quotation?',
        })}
        submitButtonText={formatMessage({
          id: 'reject-quotation-submit',
          defaultMessage: 'Reject',
        })}
        icon={
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-100 sm:mx-0 sm:h-10 sm:w-10">
            <XCircleIcon className="h-6 w-6 text-rose-600" />
          </div>
        }
      />,
    );
  };

  const proposeQuote = async () => {
    await setModal(
      <QuotationConfigurationForm
        onSubmit={async ({ quotationContext }) => {
          await makeQuotationProposal({
            quotationId: quotation?._id,
            quotationContext: quotationContext
              ? JSON.parse(quotationContext || null)
              : null,
          });
          setModal('');
        }}
        onCancel={() => setModal('')}
        successMessage={formatMessage({
          id: 'quotation-quoted-successfully',
          defaultMessage: 'Quoted successfully',
        })}
        headerText={formatMessage({
          id: 'make-proposal-header',
          defaultMessage: 'Make quotation proposal',
        })}
        submitButtonText={formatMessage({
          id: 'process-quotation-submit',
          defaultMessage: 'Mark as processed',
        })}
        icon={
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-200 sm:mx-0 sm:h-10 sm:w-10 mr-3">
            <PaperAirplaneIcon className="h-6 w-6 text-slate-950" />
          </div>
        }
      />,
    );
  };

  const timeline = {
    REQUESTED: {
      id: 1,
      content: 'created',
      visible: true,
      Component: quotation?.status === 'REQUESTED' && (
        <Button
          text="Verify"
          onClick={onVerify}
          className="bg-white-300 relative -ml-px inline-flex items-center space-x-2 rounded-md border border-slate-900 dark:border-slate-600 bg-slate-800 dark:bg-slate-600 px-2 py-1 text-base font-medium text-white hover:bg-slate-950 dark:hover:bg-slate-500  dark:focus:border-slate-400 focus:outline-hidden focus:ring-0 focus:ring-slate-800 dark:focus:ring-slate-400"
        />
      ),
    },
    PROCESSING: {
      id: 2,
      content: 'updated',
      visible: quotation?.status === 'PROCESSING',
      Component: quotation?.status === 'PROCESSING' && (
        <Button
          text="Propose"
          onClick={proposeQuote}
          className="bg-white-300 relative -ml-px inline-flex items-center space-x-2 rounded-md border border-slate-900 dark:border-slate-600 bg-slate-800 dark:bg-slate-600 px-2 py-1 text-base font-medium text-white hover:bg-slate-950 dark:hover:bg-slate-500  dark:focus:border-slate-400 focus:outline-hidden focus:ring-0 focus:ring-slate-800 dark:focus:ring-slate-400"
        />
      ),
    },
    PROPOSED: {
      id: 3,
      content: 'updated',
      visible: true,
    },
    REJECTED: {
      id: 4,
      content: 'rejected',
      visible: quotation?.status !== 'FULLFILLED',
      Component: quotation?.status !== 'FULLFILLED' &&
        quotation?.status !== 'REJECTED' && (
          <Button
            text="Reject"
            onClick={onReject}
            className="bg-white-300 relative -ml-px inline-flex items-center space-x-2 rounded-md border border-rose-500 bg-rose-500 px-2 py-2 text-base font-medium text-white hover:bg-rose-700 focus:border-rose-400 focus:outline-hidden focus:ring-0 focus:ring-rose-400"
          />
        ),
    },
    FULLFILLED: {
      id: 5,
      content: 'fullfilled',
      visible: true,
    },
  };

  return (
    <>
      <QuotationDetailHeader quotation={quotation} />
      <StatusProgress
        data={quotation}
        statusTypes={quotationStatusTypes}
        timeline={timeline}
      />
      <section aria-labelledby="products-heading" className="my-6">
        <div className="rounded-lg border-t border-b border-slate-300 dark:border-slate-800 bg-white shadow-xs sm:border">
          <div className="grid grid-cols-1 text-sm sm:grid-cols-12 sm:grid-rows-1 sm:gap-x-6 md:gap-x-8 lg:gap-x-8">
            <div className="sm:col-span-4 md:col-span-5 md:row-span-2 md:row-end-2">
              <div className="m:col-span-4 rounded-lg bg-slate-50 md:col-span-5 md:row-span-2 md:row-end-2">
                <ImageWithFallback
                  src={
                    quotation?.product?.media[0]?.file?.url || '/no-image.jpg'
                  }
                  layout="responsive"
                  width={100}
                  height={100}
                  alt={formatMessage({
                    id: 'image-not-found',
                    defaultMessage: 'Image not found',
                  })}
                />
              </div>
            </div>
            <div className="pt-6 pl-4 sm:col-span-7 md:row-end-1">
              <h3 className="text-lg font-medium text-slate-900">
                <Link
                  href={`/products?slug=${generateUniqueId(quotation?.product)}`}
                >
                  {quotation?.product?.texts?.title}
                </Link>
              </h3>
              <p className="mt-3 text-slate-500">
                {quotation?.product?.description}
              </p>

              <JSONView
                disabled
                value={JSON.stringify(
                  (quotation?.configuration || []).map(
                    ({ __typename, ...rest }) => rest,
                  ),
                  null,
                  2,
                )}
                className="bg-white dark:bg-slate-900 dark:text-slate-200 mt-1 block w-full rounded-md resize-none border-slate-300 dark:border-slate-800 sm:text-sm"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default QuotationDetail;
