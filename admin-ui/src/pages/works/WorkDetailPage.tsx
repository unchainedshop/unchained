import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';

import WorkDetail from '../../modules/work/components/WorkDetail';
import useWork from '../../modules/work/hooks/useWork';
import useRemoveWork from '../../modules/work/hooks/useRemoveWork';
import useAddWork from '../../modules/work/hooks/useAddWork';
import Loading from '../../modules/common/components/Loading';
import PageHeader from '../../modules/common/components/PageHeader';
import BreadCrumbs from '../../modules/common/components/BreadCrumbs';
import DangerMessage from '../../modules/modal/components/DangerMessage';
import useModal from '../../modules/modal/hooks/useModal';
import HeaderDeleteButton from '../../modules/common/components/HeaderDeleteButton';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useCallback } from 'react';

import { IWork, IWorkStatus } from '../../gql/types';
import RetryForm from '../../modules/work/components/RetryForm';

const WorkDetailPage = ({ workerId }) => {
  const { formatMessage } = useIntl();
  const { push } = useRouter();

  const { work } = useWork({
    workId: workerId as string,
    pollInterval: 2000,
  });

  const { setModal } = useModal();
  const { removeWork } = useRemoveWork();
  const { addWork } = useAddWork();

  const isDeletable = (status) => {
    return status === IWorkStatus.New || status === IWorkStatus.Allocated;
  };
  const canBeRetried = (work) => {
    return (
      work &&
      (work?.status === IWorkStatus.Failed ||
        work?.status === IWorkStatus.Success)
    );
  };

  const retryWork = useCallback(async () => {
    setModal(
      <RetryForm
        work={work as IWork}
        onSubmit={async (newData) => {
          try {
            const { data } = await addWork({
              type: work?.type,
              priority: newData.priority || work?.priority,
              retries: newData.retries,
              scheduled: newData.scheduled,
              input: JSON.parse(newData.input || '{}'),
              originalWorkId: work?._id,
            });
            push(`/works?workerId=${data.addWork._id}`);
            setModal(null);

            return { success: true };
          } catch (error) {
            return { success: false, error };
          }
        }}
      />,
      { closeOnOutsideClick: true },
    );
  }, [work]);

  const handleOnClick = async () => {
    await setModal(
      <DangerMessage
        onCancelClick={() => setModal('')}
        message={formatMessage({
          id: 'delete_work_confirmation',
          defaultMessage:
            'This action might cause inconsistencies with other data that relates to it. Are you sure you want to delete this work? ',
        })}
        onOkClick={async () => {
          setModal('');
          await removeWork({ workId: workerId as string });
          toast.success(
            formatMessage({
              id: 'work_deleted',
              defaultMessage: 'Work deleted successfully',
            }),
          );
        }}
        okText={formatMessage({
          id: 'delete_work',
          defaultMessage: 'Delete work',
        })}
      />,
    );
  };

  return (
    <div className="mt-5 max-w-full">
      <BreadCrumbs />
      <div className="items-center flex min-w-full justify-between gap-3 flex-wrap">
        <PageHeader
          headerText={formatMessage({
            id: 'work_detail',
            defaultMessage: 'Work Detail',
          })}
          title={formatMessage(
            {
              id: 'work_detail_title',
              defaultMessage: 'Work {id}',
            },
            { id: work?._id },
          )}
        />
        {canBeRetried(work) ? (
          <button
            type="button"
            aria-describedby="header-delete-button"
            className="my-auto flex items-center justify-center rounded-sm border-1 border-emerald-600 px-3 py-2 text-sm font-semibold text-emerald-600 shadow-xs hover:border-emerald-800 hover:bg-emerald-700 hover:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
            onClick={retryWork}
          >
            <span className="pr-1">
              {<ArrowPathIcon className="h-5 w-5" />}
            </span>
            {formatMessage({
              id: 'retry-work',
              defaultMessage: 'Retry',
            })}
          </button>
        ) : null}
        {work && isDeletable(work?.status) ? (
          <HeaderDeleteButton onClick={handleOnClick} />
        ) : null}
      </div>
      {!work ? <Loading /> : <WorkDetail work={work} />}
    </div>
  );
};

export default WorkDetailPage;
