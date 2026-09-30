import { useMemo } from 'react';
import { useAuth } from '@unchainedshop/admin-ui/hooks';
import { useIntl } from 'react-intl';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import {
  BreadCrumbs,
  Button,
  Loading,
  LocaleWrapper,
  PageHeader,
  SelectOptions,
  Tab,
  TagList,
} from '@unchainedshop/admin-ui/ui';
import { DangerMessage } from '@unchainedshop/admin-ui/modal';
import { useApp, useModal } from '@unchainedshop/admin-ui/hooks';
import { ProductMediaForm, ProductTextsForm } from '@unchainedshop/admin-ui/modules/product';
import useTicketProduction from '../../hooks/useTicketProduction.ts';
import useTicketProductionMutations from '../../hooks/useTicketProductionMutations.ts';
import { buildPerformanceGrid } from '../../utils/production-grid.ts';
import { useFormatDateTime } from '../../utils/misc.ts';
import ProductionEventForm from './ProductionEventForm.tsx';
import TicketCategoriesTab from './TicketCategoriesTab.tsx';
import TicketDatesTab from './TicketDatesTab.tsx';
import { errorMessage } from './fields.tsx';

const ProductionTab = ({
  selectedView = 'dates',
  production,
}: {
  selectedView?: string;
  production: any;
}) => {
  if (selectedView === 'texts')
    return (
      <LocaleWrapper>
        <ProductTextsForm productId={production._id} />
      </LocaleWrapper>
    );
  if (selectedView === 'media')
    return (
      <LocaleWrapper>
        <ProductMediaForm productId={production._id} />
      </LocaleWrapper>
    );
  if (selectedView === 'event') return <ProductionEventForm production={production} />;
  if (selectedView === 'categories') return <TicketCategoriesTab production={production} />;
  return <TicketDatesTab production={production} />;
};

/**
 * A ticket production, laid out like a product: status and delete in the header, tags, and tabs
 * for the dates, the ticket categories, the event details and sale rules, texts and media. Texts,
 * media, tags and details are taken over by all dates.
 */
const TicketProductionDetail = ({ productId }: { productId: string }) => {
  const { formatMessage } = useIntl();
  const { push } = useRouter();
  const { setModal } = useModal();
  const { hasRole } = useAuth();
  const { selectedLocale, shopInfo } = useApp();
  const { formatDateTime } = useFormatDateTime();
  const { production, loading } = useTicketProduction({ productId, locale: selectedLocale });
  const mutations = useTicketProductionMutations();
  const canManage = hasRole('manageProducts');
  const status = production?.status || 'DRAFT';

  const statusOptions = useMemo(
    () => [
      {
        id: 'published',
        title: formatMessage({ id: 'published', defaultMessage: 'Published' }),
        description: formatMessage({
          id: 'publish_production_description',
          defaultMessage: 'The production and all its dates can be found and tickets bought',
        }),
        current: status === 'ACTIVE',
        selectedTitle: formatMessage({ id: 'published', defaultMessage: 'Published' }),
        bgColor: 'green',
        disable: !canManage,
        onClick: async () => {
          try {
            await mutations.publishTicketProduction(productId);
            toast.success(
              formatMessage({ id: 'production_published', defaultMessage: 'Published with all dates' }),
            );
          } catch (error) {
            toast.error(errorMessage(error));
          }
        },
      },
      {
        id: 'draft',
        title: formatMessage({ id: 'draft', defaultMessage: 'Draft' }),
        description: formatMessage({
          id: 'draft_production_description',
          defaultMessage: 'The production and its dates are hidden and no tickets can be bought',
        }),
        current: status === 'DRAFT',
        selectedTitle: formatMessage({ id: 'not_published', defaultMessage: 'Not published' }),
        bgColor: 'amber',
        disable: !canManage,
        onClick: async () => {
          try {
            await mutations.unpublishTicketProduction(productId);
            toast.success(
              formatMessage({ id: 'production_drafted', defaultMessage: 'Drafted with all dates' }),
            );
          } catch (error) {
            toast.error(errorMessage(error));
          }
        },
      },
    ],
    [status, canManage, productId],
  );

  const onDelete = () =>
    setModal(
      <DangerMessage
        onCancelClick={() => setModal('')}
        message={formatMessage({
          id: 'delete_production_confirmation',
          defaultMessage:
            'Delete this production with all its dates? Productions with sold tickets cannot be deleted; cancel their dates instead.',
        })}
        onOkClick={async () => {
          setModal('');
          try {
            await mutations.removeTicketProduction(productId);
            toast.success(
              formatMessage({ id: 'product_deleted_success', defaultMessage: 'Deleted successfully' }),
            );
            push('/ext/ticketing');
          } catch (error) {
            toast.error(errorMessage(error));
          }
        }}
        okText={formatMessage({ id: 'delete', defaultMessage: 'Delete' })}
      />,
    );

  const onUpdateTags = async ({ tags }) => {
    try {
      await mutations.updateTicketProduction(productId, { tags });
      return true;
    } catch (error) {
      toast.error(errorMessage(error));
      return false;
    }
  };

  if (loading && !production) return <Loading />;
  if (!production?.ticketProduction) return null;

  const { rows, columns } = buildPerformanceGrid(production);
  const upcoming = rows.find(({ startsAt }) => Date.parse(startsAt) >= Date.now());
  const tags = (production.tags ?? []).filter((tag) => tag !== 'ticket-production');

  const tabItems = [
    {
      id: 'dates',
      title: formatMessage({ id: 'performances', defaultMessage: 'Dates' }),
      length: rows.length,
    },
    {
      id: 'categories',
      title: formatMessage({ id: 'ticket_categories', defaultMessage: 'Ticket categories' }),
      length: production.ticketProduction.categories?.length || undefined,
    },
    {
      id: 'event',
      title: formatMessage({ id: 'production_event_tab', defaultMessage: 'Event & sale' }),
    },
    { id: 'texts', title: formatMessage({ id: 'texts', defaultMessage: 'Texts' }) },
    { id: 'media', title: formatMessage({ id: 'media', defaultMessage: 'Media' }) },
  ];

  return (
    <div className="mt-5 max-w-full">
      <BreadCrumbs depth={4} currentPageTitle={production.texts?.title} />
      <div className="flex min-w-full flex-wrap items-center justify-between gap-5">
        <PageHeader
          headerText={
            production.texts?.title || formatMessage({ id: 'production', defaultMessage: 'Production' })
          }
          title={`${production.texts?.title || 'Production'} (${production._id})`}
        />
        <div className="flex flex-wrap gap-3">
          <SelectOptions
            options={statusOptions}
            type={formatMessage({ id: 'production', defaultMessage: 'Production' })}
          />
          {canManage && (
            <Button
              variant="danger"
              text={formatMessage({ id: 'delete', defaultMessage: 'Delete' })}
              onClick={onDelete}
            />
          )}
        </div>
      </div>
      <div className="mt-8 flex flex-wrap gap-3 gap-x-10 text-sm text-text-secondary">
        {production.texts?.subtitle && <span>{production.texts.subtitle}</span>}
        {production.ticketProduction.location && <span>{production.ticketProduction.location}</span>}
        <span>
          {formatMessage(
            {
              id: 'production_summary',
              defaultMessage:
                '{dates, plural, =0 {No dates yet} one {# date} other {# dates}}{categories, plural, =0 {} one {, # ticket category} other {, # ticket categories}}',
            },
            { dates: rows.length, categories: columns.filter(Boolean).length },
          )}
        </span>
        {upcoming && (
          <span>
            {formatMessage(
              { id: 'production_next_date', defaultMessage: 'Next: {date}' },
              { date: formatDateTime(upcoming.startsAt, { dateStyle: 'medium', timeStyle: 'short' }) },
            )}
          </span>
        )}
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-10">
        <TagList
          defaultValue={tags}
          onSubmit={onUpdateTags}
          enableEdit={canManage}
          availableTagOptions={(shopInfo?.adminUiConfig?.productTags || [])
            .filter((tag) => !tags.includes(tag))
            .map((tag) => ({ value: tag, label: tag }))}
        />
      </div>
      <Tab tabItems={tabItems} defaultTab="dates">
        <ProductionTab production={production} />
      </Tab>
    </div>
  );
};

export default TicketProductionDetail;
