import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';
import BreadCrumbs from '../../modules/common/components/BreadCrumbs';
import Loading from '../../modules/common/components/Loading';
import PageHeader from '../../modules/common/components/PageHeader';
import AssortmentDetail from '../../modules/assortment/components/AssortmentDetail';
import useAssortment from '../../modules/assortment/hooks/useAssortment';
import useFormatDateTime from '../../modules/common/utils/useFormatDateTime';
import SelectOptions from '../../modules/common/components/SelectOptions';
import HeaderDeleteButton from '../../modules/common/components/HeaderDeleteButton';
import useUpdateAssortment from '../../modules/assortment/hooks/useUpdateAssortment';
import useSetBaseAssortment from '../../modules/assortment/hooks/useSetBaseAssortment';
import useRemoveAssortment from '../../modules/assortment/hooks/useRemoveAssortment';
import useAuth from '../../modules/Auth/useAuth';
import useModal from '../../modules/modal/hooks/useModal';
import DangerMessage from '../../modules/modal/components/DangerMessage';
import AlertMessage from '../../modules/modal/components/AlertMessage';
import AssortmentImageGallery from '../../modules/assortment/components/AssortmentImageGallery';

const AssortmentDetailPage = ({ assortmentSlug }) => {
  const { formatDateTime } = useFormatDateTime();
  const { formatMessage } = useIntl();
  const { hasRole } = useAuth();
  const { updateAssortment } = useUpdateAssortment();
  const { setBaseAssortment } = useSetBaseAssortment();
  const { removeAssortment } = useRemoveAssortment();
  const { setModal } = useModal();
  const router = useRouter();

  const { assortment, loading, extendedData } = useAssortment({
    slug: assortmentSlug,
  });

  const { isActive, isBase, isRoot } = assortment || {};

  const updateAssortmentSequence = async (e) => {
    if (e.target.value) {
      await updateAssortment({
        assortmentId: assortment?._id,
        assortment: {
          sequence: parseInt(e.target.value as string, 10),
        },
      });
    }
  };

  const setAsBase = async () => {
    await setModal(
      <AlertMessage
        buttonText={formatMessage({
          id: 'mark_as_base',
          defaultMessage: 'Mark as Base',
        })}
        headerText={formatMessage({
          id: 'header_title',
          defaultMessage: 'Assortment base change.',
        })}
        message={formatMessage({
          id: 'header_conformation',
          defaultMessage:
            'This action is nonreversible, are you sure you want to change it to base?',
        })}
        onOkClick={async () => {
          setModal('');
          await setBaseAssortment({ assortmentId: assortment?._id });
          toast.success(
            formatMessage({
              id: 'assortment_made_base',
              defaultMessage: 'Assortment changed to base',
            }),
          );
        }}
      />,
    );
  };

  const setIsRoot = async (isRoot) => {
    await updateAssortment({
      assortmentId: assortment?._id,
      assortment: { isRoot },
    });
    return true;
  };

  const setActive = async (value) => {
    await updateAssortment({
      assortmentId: assortment?._id,
      assortment: { isActive: value },
    });
    return true;
  };

  const activeOptions = [
    {
      id: 'active',
      title: formatMessage({
        id: 'activate',
        defaultMessage: 'Activate',
      }),
      selectedTitle: formatMessage({
        id: 'activated',
        defaultMessage: 'Activated',
      }),
      description: formatMessage({
        id: 'activate_assortment_description',
        defaultMessage: 'Will be visible on search',
      }),
      current: isActive,
      disable: !hasRole('manageAssortments'),
      bgColor: 'emerald',
      onClick: async () => {
        await setActive(true);
        toast.success(
          formatMessage({
            id: 'assortment_activated',
            defaultMessage: 'Assortment activated successfully',
          }),
        );
      },
    },
    {
      id: 'in-active',
      title: formatMessage({
        id: 'deactivate',
        defaultMessage: 'Deactivate',
      }),
      selectedTitle: formatMessage({
        id: 'deactivated',
        defaultMessage: 'Deactivated',
      }),
      description: formatMessage({
        id: 'deactivate_assortment_description',
        defaultMessage: 'Will not be visible on search',
      }),
      current: !isActive,
      disable: !hasRole('manageAssortments'),
      bgColor: 'amber',
      onClick: async () => {
        await setActive(false);
        toast.success(
          formatMessage({
            id: 'assortment_deactivated',
            defaultMessage: 'Assortment deactivated successfully',
          }),
        );
      },
    },
  ];

  const rootOptions = [
    {
      id: 'root',
      title: formatMessage({
        id: 'make_root',
        defaultMessage: 'Make root',
      }),
      selectedTitle: formatMessage({
        id: 'root',
        defaultMessage: 'Root',
      }),
      description: formatMessage({
        id: 'root_assortment_description',
        defaultMessage: 'Can not be assigned as a child of another assortment ',
      }),
      disable: !hasRole('manageAssortments'),
      current: isRoot,
      bgColor: 'stone',
      onClick: async () => {
        await setIsRoot(true);
        toast.success(
          formatMessage({
            id: 'assortment_changed_to_root',
            defaultMessage: 'Assortment changed to root',
          }),
        );
      },
    },
    {
      id: 'leaf',
      selectedTitle: formatMessage({
        id: 'leaf',
        defaultMessage: 'Leaf',
      }),
      title: formatMessage({
        id: 'make_leaf',
        defaultMessage: 'Make leaf',
      }),
      disable: !hasRole('manageAssortments'),
      description: formatMessage({
        id: 'leaf_assortment_description',
        defaultMessage: 'Can be assigned as a child of another assortment ',
      }),
      current: !isRoot,
      bgColor: 'emerald',
      onClick: async () => {
        await setIsRoot(false);
        toast.success(
          formatMessage({
            id: 'assortment_changed_to_leaf',
            defaultMessage: 'Assortment changed to leaf',
          }),
        );
      },
    },
  ];

  const handleDeleteAssortment = async () => {
    await setModal(
      <DangerMessage
        onCancelClick={() => setModal('')}
        message={formatMessage({
          id: 'delete_assortment_confirmation',
          defaultMessage:
            'This action might cause inconsistencies with other data that relates to it and it is nonreversible. Are you sure you want to delete this assortment?',
        })}
        onOkClick={async () => {
          setModal('');
          await removeAssortment({ assortmentId: assortment._id });
          toast.success(
            formatMessage({
              id: 'assortment_deleted_success',
              defaultMessage: 'Deleted successfully',
            }),
          );
          router.push('/assortments');
        }}
      />,
    );
  };
  if (!assortment && !loading) {
    router.push('/404');
    return null;
  }
  if (loading) return <Loading />;

  return (
    <div className="mt-5 max-w-full">
      <BreadCrumbs
        routeName={assortmentSlug}
        depth={3}
        currentPageTitle={assortment?.texts?.title}
      />
      <div>
        <div className="items-center flex-wrap flex gap-5 min-w-full justify-between">
          <PageHeader
            headerText={assortment?.texts?.title || 'Untitled Assortment'}
            title={`${assortment?.texts?.title || 'Assortment'} (${assortment?._id})`}
          />
          <div className="flex flex-wrap gap-3">
            <SelectOptions
              options={activeOptions}
              type={formatMessage({
                id: 'assortment',
                defaultMessage: 'Assortment',
              })}
            />
            <SelectOptions
              options={rootOptions}
              type={formatMessage({
                id: 'assortment',
                defaultMessage: 'Assortment',
              })}
            />
            <div className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium leading-5 shadow-sm bg-white dark:bg-slate-800 h-[38px]">
              <label
                htmlFor="sequence"
                className="text-slate-700 dark:text-slate-200 font-medium"
              >
                {formatMessage({
                  id: 'sequence',
                  defaultMessage: 'Display Order',
                })}
              </label>
              <input
                id="sequence"
                type="number"
                disabled={!hasRole('manageAssortments')}
                className="text-center w-12 bg-transparent border border-slate-300 dark:border-slate-600 rounded focus:ring-0 focus:outline-none text-sm font-semibold text-slate-900 dark:text-slate-300 px-2 py-1"
                defaultValue={assortment?.sequence}
                onBlur={updateAssortmentSequence}
              />
            </div>
            {hasRole('manageAssortments') && (
              <>
                <div>
                  {isBase ? (
                    <span
                      id="is_base"
                      className="py-2.5 px-8 text-sm font-medium text-white bg-sky-500 white inline-flex items-center shadow-md rounded-md h-[38px]"
                    >
                      {formatMessage({
                        id: 'base',
                        defaultMessage: 'Base',
                      })}
                    </span>
                  ) : (
                    <button
                      id="not_base"
                      type="button"
                      onClick={setAsBase}
                      className="inline-flex items-center gap-2 justify-center rounded-md border border-slate-600 dark:border-slate-600 px-4 py-2 text-sm font-medium leading-5 text-slate-700 dark:text-slate-200 shadow-md hover:bg-slate-800 hover:text-white dark:hover:bg-slate-700 focus:outline-hidden focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 h-[38px]"
                    >
                      {formatMessage({
                        id: 'not_base',
                        defaultMessage: 'Mark as Base',
                      })}
                    </button>
                  )}
                </div>
                <HeaderDeleteButton onClick={handleDeleteAssortment} />
              </>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 gap-x-10 text-slate-600 dark:text-slate-400">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-slate-600 dark:text-slate-400">
              ID:
            </span>
            <span className="text-sm font-mono">{assortment?._id}</span>
          </div>
          {assortment?.created && (
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-slate-600 dark:text-slate-300">
                {formatMessage({ id: 'created', defaultMessage: 'Created' })}:
              </span>
              <span className="text-sm font-mono">
                {formatDateTime(assortment.created, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>
          )}

          {assortment?.updated && (
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-slate-600 dark:text-slate-300">
                {formatMessage({ id: 'updated', defaultMessage: 'Updated' })}:
              </span>
              <span className="text-sm font-mono">
                {formatDateTime(assortment.updated, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      <AssortmentImageGallery
        assortmentId={assortment?._id}
        media={assortment?.media || ([] as any)}
        onEditMedia={(mediaId) => {
          // Navigate to media tab
          router.push(
            {
              pathname: router.pathname,
              query: { ...router.query, tab: 'media' },
            },
            undefined,
            {
              shallow: true,
            },
          );
        }}
        canEdit={hasRole('manageAssortments')}
      />

      <AssortmentDetail
        assortment={assortment}
        extendedData={extendedData}
        hideControls={true}
      />
    </div>
  );
};

export default AssortmentDetailPage;
