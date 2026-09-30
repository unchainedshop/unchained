import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { useModal, DangerMessage } from '@unchainedshop/admin-ui/modal';
import { Badge, Loading, PageHeader } from '@unchainedshop/admin-ui/ui';
import useShopDefaults from '../../hooks/useShopDefaults.ts';
import useTicketProduction from '../../hooks/useTicketProduction.ts';
import useTicketProductionMutations from '../../hooks/useTicketProductionMutations.ts';
import useViewerActions from '../../hooks/useViewerActions.ts';
import ProductionEditForm from './ProductionEditForm.tsx';
import ProductionCover from './ProductionCover.tsx';
import TicketCategoryList from './TicketCategoryList.tsx';
import TicketPerformanceGrid from './TicketPerformanceGrid.tsx';
import {
  dangerButtonClassName,
  errorMessage,
  primaryButtonClassName,
  secondaryButtonClassName,
} from './fields.tsx';

const STATUS_COLORS = { ACTIVE: 'emerald', DRAFT: 'amber', DELETED: 'rose' };

/**
 * A ticket production: its texts, details and sale rules, the cover shared with all dates, the
 * ticket categories and the dates with sales per category. Publishing publishes all dates.
 */
const TicketProductionDetail = ({ productId }: { productId: string }) => {
  const { formatMessage } = useIntl();
  const { push } = useRouter();
  const { setModal } = useModal();
  const shop = useShopDefaults();
  const { production, loading } = useTicketProduction({ productId, locale: shop.locale });
  const mutations = useTicketProductionMutations();
  const { hasAction } = useViewerActions();
  const canCancel = hasAction('cancelTicket');

  const run = useCallback(async (task: () => Promise<unknown>, success: string) => {
    try {
      await task();
      toast.success(success);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }, []);

  const onRemove = useCallback(async () => {
    await setModal(
      <DangerMessage
        onCancelClick={() => setModal('')}
        message={formatMessage({
          id: 'production_remove_confirmation',
          defaultMessage:
            'Remove this production with all its dates? Productions with tickets cannot be removed, cancel their dates instead.',
        })}
        onOkClick={async () => {
          setModal('');
          try {
            await mutations.removeTicketProduction(productId);
            toast.success(
              formatMessage({ id: 'production_removed', defaultMessage: 'Production removed' }),
            );
            push('/ext/ticketing');
          } catch (error) {
            toast.error(errorMessage(error));
          }
        }}
        okText={formatMessage({ id: 'production_remove', defaultMessage: 'Remove production' })}
      />,
    );
  }, [formatMessage, mutations, productId, push, setModal]);

  if (loading && !production) return <Loading />;
  if (!production?.ticketProduction) return null;

  const isActive = production.status === 'ACTIVE';

  return (
    <>
      <PageHeader
        headerText={formatMessage(
          { id: 'production_detail_title', defaultMessage: 'Production: {title}' },
          { title: production.texts?.title || productId },
        )}
      />
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Badge text={production.status} color={STATUS_COLORS[production.status] || 'slate'} square />
        <button
          type="button"
          className={isActive ? secondaryButtonClassName : primaryButtonClassName}
          onClick={() =>
            isActive
              ? run(
                  () => mutations.unpublishTicketProduction(productId),
                  formatMessage({
                    id: 'production_unpublished',
                    defaultMessage: 'Production and dates unpublished',
                  }),
                )
              : run(
                  () => mutations.publishTicketProduction(productId),
                  formatMessage({
                    id: 'production_published',
                    defaultMessage: 'Production and dates published',
                  }),
                )
          }
        >
          {isActive
            ? formatMessage({ id: 'production_unpublish', defaultMessage: 'Unpublish' })
            : formatMessage({ id: 'production_publish', defaultMessage: 'Publish' })}
        </button>
        <button
          type="button"
          className={secondaryButtonClassName}
          title={formatMessage({
            id: 'production_sync_hint',
            defaultMessage: 'Takes texts, tags, details, status and media over to all dates again',
          })}
          onClick={() =>
            run(
              () => mutations.syncTicketProduction(productId),
              formatMessage({ id: 'production_synced', defaultMessage: 'Dates updated' }),
            )
          }
        >
          {formatMessage({ id: 'production_sync', defaultMessage: 'Update dates' })}
        </button>
        <button type="button" className={dangerButtonClassName} onClick={onRemove}>
          {formatMessage({ id: 'production_remove', defaultMessage: 'Remove production' })}
        </button>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProductionEditForm production={production} shop={shop} />
        </div>
        <ProductionCover production={production} />
      </div>
      <div className="mt-6">
        <TicketCategoryList production={production} shop={shop} />
      </div>
      <div className="mt-6">
        <TicketPerformanceGrid production={production} shop={shop} canCancel={canCancel} />
      </div>
    </>
  );
};

export default TicketProductionDetail;
