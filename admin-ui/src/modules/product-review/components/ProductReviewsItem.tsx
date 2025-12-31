import {
  FlagIcon,
  HandThumbDownIcon,
  HandThumbUpIcon,
} from '@heroicons/react/24/outline';
import { useIntl } from 'react-intl';
import { IRoleAction } from '../../../gql/types';

import { toast } from 'react-toastify';
import classNames from 'classnames';
import DeleteButton from '../../common/components/DeleteButton';
import useFormatDateTime from '../../common/utils/useFormatDateTime';
import DangerMessage from '../../modal/components/DangerMessage';
import useModal from '../../modal/hooks/useModal';
import useRemoveProductReview from '../hooks/useRemoveProductReview';
import Badge from '../../common/components/Badge';
import ImageWithFallback from '../../common/components/ImageWithFallback';
import formatUsername from '../../common/utils/formatUsername';
import useAddProductReviewVote from '../hooks/useAddProductReviewVote';
import useRemoveProductReviewVote from '../hooks/useRemoveProductReviewVote';
import useAuth from '../../Auth/useAuth';
import useCurrentUser from '../../accounts/hooks/useCurrentUser';
import ProductReviewReportCommentForm from './ProductReviewReportCommentForm';
import CustomError from '../../common/CustomError';
import { OnSubmitType } from '../../forms/hooks/useForm';

const voteTypes = {
  UPVOTE: 'UPVOTE',
  DOWNVOTE: 'DOWNVOTE',
  REPORT: 'REPORT',
};

const ProductReviewsItem = ({
  review,
  enableDelete = true,
  showProduct = false,
}) => {
  const { formatMessage } = useIntl();
  const { currentUser } = useCurrentUser();
  const { formatDateTime } = useFormatDateTime();
  const { setModal } = useModal();
  const { addProductReviewVote } = useAddProductReviewVote();
  const { removeProductReviewVote } = useRemoveProductReviewVote();
  const { hasRole, isAdmin } = useAuth();

  const hasAlreadyVoted = (type) =>
    !!review.ownVotes.find((v) => v.type === type);
  const toggleVote = async (type) => {
    const onReportSubmit: OnSubmitType = async ({ message }) => {
      try {
        await addProductReviewVote({
          productReviewId: review._id,
          type,
          meta: { message },
        });
        return { success: true };
      } catch (e: any) {
        if (e instanceof CustomError)
          return { success: false, error: e?.message };
        else return { success: false, error: e };
      }
    };

    if (hasAlreadyVoted(type)) {
      await removeProductReviewVote({ productReviewId: review._id, type });
    } else {
      if (type === voteTypes.REPORT) {
        await setModal(
          <ProductReviewReportCommentForm
            onSubmit={onReportSubmit}
            onSubmitSuccess={async () => setModal(null)}
          />,
        );
      } else {
        await addProductReviewVote({ productReviewId: review._id, type });
      }
    }
  };

  const { removeProductReview } = useRemoveProductReview();
  const canDeleteReview =
    (!review.deleted &&
      hasRole(IRoleAction.VoteProductReview) &&
      enableDelete &&
      review?.author?._id === currentUser?._id) ||
    (isAdmin() && !review.deleted);

  const canManageVotes =
    !review.deleted && hasRole(IRoleAction.VoteProductReview);
  const product = review?.product;

  const onRemove = async (productReviewId) => {
    await setModal(
      <DangerMessage
        onCancelClick={async () => setModal('')}
        message={formatMessage({
          id: 'delete_review_confirmation',
          defaultMessage:
            'This action might cause inconsistencies with other data that relates to it. Are you sure you want to delete this review? ',
        })}
        onOkClick={async () => {
          setModal('');
          await removeProductReview({ productReviewId });
          toast.success(
            formatMessage({
              id: 'review_deleted',
              defaultMessage: 'Review deleted successfully',
            }),
          );
        }}
        okText={formatMessage({
          id: 'delete_review',
          defaultMessage: 'Delete review',
        })}
      />,
    );
  };

  return (
    <div
      key={review._id}
      className={classNames(
        'mb-4 rounded-lg shadow-sm bg-white dark:bg-slate-800 p-4',
        {
          'border-rose-200 bg-rose-50 dark:bg-rose-950': review.deleted,
        },
        {
          'border-slate-200 dark:border-slate-700': !review.deleted,
        },
      )}
    >
      <div className="flex items-center">
        {showProduct ? (
          <ImageWithFallback
            src={product?.media[0]?.file?.url}
            alt={review?.author?.username}
            width={48}
            height={48}
            className="h-12 w-12 rounded-full aspect-square object-cover object-center"
          />
        ) : (
          <ImageWithFallback
            src={review?.author?.avatar?.url}
            alt={review?.author?.username}
            width={48}
            height={48}
            className="h-12 w-12 rounded-full aspect-square object-cover object-center"
          />
        )}
        <div className="ml-4 flex-1">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {showProduct
              ? product?.texts?.title || (
                  <>
                    {product._id}{' '}
                    <Badge
                      color="yellow"
                      text={formatMessage({
                        id: 'title_not_found',
                        defaultMessage: 'Title not found',
                      })}
                    />
                  </>
                )
              : formatUsername(review?.author)}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            <time dateTime={review.updated || review.created}>
              {formatDateTime(review.updated || review.created, {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
            </time>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={!canManageVotes}
            onClick={async () => toggleVote(voteTypes.UPVOTE)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors disabled:opacity-50 ${
              hasAlreadyVoted(voteTypes.UPVOTE)
                ? 'bg-emerald-100 dark:bg-emerald-900 hover:bg-emerald-200 dark:hover:bg-emerald-800'
                : 'hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <HandThumbUpIcon
              className={`h-5 w-5 ${
                hasAlreadyVoted(voteTypes.UPVOTE)
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            />
            <span
              className={`text-sm font-medium ${
                hasAlreadyVoted(voteTypes.UPVOTE)
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              {review.upVote}
            </span>
          </button>
          <button
            type="button"
            disabled={!canManageVotes}
            onClick={async () => toggleVote(voteTypes.DOWNVOTE)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors disabled:opacity-50 ${
              hasAlreadyVoted(voteTypes.DOWNVOTE)
                ? 'bg-rose-100 dark:bg-rose-900 hover:bg-rose-200 dark:hover:bg-rose-800'
                : 'hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <HandThumbDownIcon
              className={`h-5 w-5 ${
                hasAlreadyVoted(voteTypes.DOWNVOTE)
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            />
            <span
              className={`text-sm font-medium ${
                hasAlreadyVoted(voteTypes.DOWNVOTE)
                  ? 'text-rose-700 dark:text-rose-300'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              {review.downVote}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 ml-4">
          {hasRole(IRoleAction.VoteProductReview) && (
            <button
              type="button"
              disabled={!canManageVotes}
              onClick={async () => toggleVote(voteTypes.REPORT)}
              className={`p-2 rounded-md transition-colors disabled:opacity-50 ${
                hasAlreadyVoted(voteTypes.REPORT)
                  ? 'bg-orange-100 dark:bg-orange-900 hover:bg-orange-200 dark:hover:bg-orange-800'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title="Report review"
            >
              <FlagIcon
                className={classNames('h-4 w-4', {
                  'text-orange-600 dark:text-orange-400': hasAlreadyVoted(
                    voteTypes.REPORT,
                  ),
                  'text-slate-400 dark:text-slate-500': !hasAlreadyVoted(
                    voteTypes.REPORT,
                  ),
                })}
              />
            </button>
          )}
          {canDeleteReview && (
            <DeleteButton onClick={() => onRemove(review._id)} className="" />
          )}
          {review.deleted && (
            <Badge
              text={formatMessage({
                id: 'deleted_text',
                defaultMessage: 'Deleted',
              })}
              color="red"
              className="ml-2"
            />
          )}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {review.title}
        </h3>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {review.review}
        </p>
      </div>
    </div>
  );
};

export default ProductReviewsItem;
