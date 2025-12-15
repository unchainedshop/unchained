import { useIntl } from 'react-intl';
import { IRoleAction } from '../../../gql/types';

import {
  DocumentTextIcon,
  LinkIcon,
  FilmIcon,
  CubeIcon,
  FunnelIcon,
  PuzzlePieceIcon,
} from '@heroicons/react/20/solid';

import { toast } from 'react-toastify';
import { useRouter } from 'next/router';
import LocaleWrapper from '../../common/components/LocaleWrapper';
import SelectOptions from '../../common/components/SelectOptions';
import HeaderDeleteButton from '../../common/components/HeaderDeleteButton';
import ErrorBoundary from '../../common/components/ErrorBoundary';
import DangerMessage from '../../modal/components/DangerMessage';
import useRemoveAssortment from '../hooks/useRemoveAssortment';
import AssortmentTextForm from './AssortmentTextForm';
import SafeAssortmentMediaForm from './SafeAssortmentMediaForm';
import AssortmentLinks from './AssortmentLinks';
import AssortmentProducts from './AssortmentProducts';
import AssortmentFilters from './AssortmentFilters';
import useUpdateAssortment from '../hooks/useUpdateAssortment';
import Tab from '../../common/components/Tab';
import TagList from '../../common/components/TagList';
import useSetBaseAssortment from '../hooks/useSetBaseAssortment';
import useAuth from '../../Auth/useAuth';
import useModal from '../../modal/hooks/useModal';
import AlertMessage from '../../modal/components/AlertMessage';
import DisplayExtendedFields from '../../common/components/DisplayExtendedFields';
import useApp from '../../common/hooks/useApp';

const GetCurrentTab = ({ id, selectedView, ...extendedData }) => {
  if (selectedView === 'texts')
    return (
      <LocaleWrapper>
        <AssortmentTextForm assortmentId={id} />
      </LocaleWrapper>
    );
  if (selectedView === 'links')
    return (
      <LocaleWrapper>
        <AssortmentLinks assortmentId={id} />
      </LocaleWrapper>
    );
  if (selectedView === 'media')
    return (
      <ErrorBoundary>
        <LocaleWrapper>
          <SafeAssortmentMediaForm assortmentId={id} />
        </LocaleWrapper>
      </ErrorBoundary>
    );
  if (selectedView === 'products')
    return (
      <LocaleWrapper>
        <AssortmentProducts assortmentId={id} />
      </LocaleWrapper>
    );
  if (selectedView === 'filters')
    return (
      <LocaleWrapper>
        <AssortmentFilters assortmentId={id} />
      </LocaleWrapper>
    );
  if (selectedView === 'extended')
    return (
      <LocaleWrapper>
        <DisplayExtendedFields data={extendedData} />
      </LocaleWrapper>
    );
  return (
    <LocaleWrapper>
      <AssortmentTextForm assortmentId={id} />
    </LocaleWrapper>
  );
};
const AssortmentDetail = ({
  assortment,
  extendedData,
  hideControls = false,
}) => {
  const { isActive, isBase, isRoot } = assortment || {};
  const { hasRole } = useAuth();
  const { shopInfo } = useApp();
  const { formatMessage } = useIntl();
  const { updateAssortment } = useUpdateAssortment();
  const { setBaseAssortment } = useSetBaseAssortment();
  const { removeAssortment } = useRemoveAssortment();
  const { setModal } = useModal();
  const router = useRouter();

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

  const assortmentOptions = [
    {
      id: 'texts',
      title: formatMessage({
        id: 'texts',
        defaultMessage: 'Texts',
      }),
      Icon: <DocumentTextIcon className="h-5 w-5" />,
    },

    {
      id: 'links',
      title: formatMessage({
        id: 'links',
        defaultMessage: 'Links',
      }),
      Icon: <LinkIcon className="h-5 w-5" />,
    },
    {
      id: 'media',
      title: formatMessage({
        id: 'media',
        defaultMessage: 'Media',
      }),
      Icon: <FilmIcon className="h-5 w-5" />,
    },
    {
      id: 'products',
      title: formatMessage({
        id: 'products',
        defaultMessage: 'Products',
      }),
      Icon: <CubeIcon className="h-5 w-5" />,
    },
    {
      id: 'filters',
      title: formatMessage({
        id: 'filters',
        defaultMessage: 'Filters',
      }),
      Icon: <FunnelIcon className="h-5 w-5" />,
    },
    extendedData !== null && {
      id: 'extended',
      title: formatMessage({
        id: 'extended-fields',
        defaultMessage: 'Extended',
      }),
      Icon: <PuzzlePieceIcon className="h-5 w-5" />,
    },
  ];

  const setIsRoot = async (isRoot) => {
    await updateAssortment({
      assortmentId: assortment?._id,
      assortment: { isRoot },
    });
    return true;
  };

  const updateAssortmentTags = async ({ tags }) => {
    await updateAssortment({
      assortmentId: assortment?._id,
      assortment: { tags },
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
      current: isRoot,
      bgColor: 'emerald',
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

  return (
    <>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-10">
        <TagList
          defaultValue={assortment?.tags}
          onSubmit={updateAssortmentTags}
          enableEdit={hasRole(IRoleAction.ManageAssortments)}
          availableTagOptions={
            shopInfo?.adminUiConfig?.assortmentTags
              ?.filter((t) => !(assortment?.tags || [])?.includes(t))
              ?.map((tag) => ({
                value: tag,
                label: tag,
              })) || []
          }
        />
        {!hideControls && (
          <div className="mt-5 flex flex-wrap gap-3">
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
                className="text-center w-12 bg-transparent border border-slate-300 dark:border-slate-600 rounded focus:ring-0 focus:outline-none text-sm font-semibold text-slate-900 dark:text-slate-300 px-2 py-1"
                defaultValue={assortment?.sequence}
                onBlur={updateAssortmentSequence}
              />
            </div>
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
            <SelectOptions
              options={rootOptions}
              type={formatMessage({
                id: 'assortment',
                defaultMessage: 'Assortment',
              })}
            />
            <SelectOptions
              options={activeOptions}
              type={formatMessage({
                id: 'assortment',
                defaultMessage: 'Assortment',
              })}
            />
            {hasRole(IRoleAction.ManageAssortments) && (
              <HeaderDeleteButton onClick={handleDeleteAssortment} />
            )}
          </div>
        )}
      </div>

      <Tab tabItems={assortmentOptions} defaultTab="texts">
        <GetCurrentTab id={assortment?._id} {...extendedData} />
      </Tab>
    </>
  );
};

export default AssortmentDetail;
