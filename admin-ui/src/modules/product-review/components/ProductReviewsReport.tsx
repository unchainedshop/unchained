import {
  HandThumbDownIcon,
  HandThumbUpIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { FormattedMessage, useIntl } from 'react-intl';

const ProductReviewsReport = ({ productReviews }) => {
  const { formatMessage } = useIntl();

  const totalUpVote = productReviews.reduce(
    (prev, next) => prev + next.upVote,
    0,
  );

  const totalDownVote = productReviews.reduce(
    (prev, next) => prev + next.downVote,
    0,
  );

  const averageUpVote = totalUpVote
    ? (totalUpVote / (totalUpVote + totalDownVote)) * 100
    : 0;

  const averageDownVote = averageUpVote ? 100 - averageUpVote : 0;

  return (
    <div className="lg:col-span-4">
      <h2 className="text-2xl">
        {formatMessage({
          id: 'customer_reviews',
          defaultMessage: 'Customer Reviews',
        })}
      </h2>

      <div className="mt-3 flex items-center">
        <div>
          <div title={`${averageUpVote}`} className="flex items-center">
            {[0, 1, 2, 3, 4].map((rating) => {
              const isFilled = averageUpVote >= rating * 20;
              return (
                <StarIcon
                  key={rating}
                  className={`
                        ${
                          isFilled
                            ? 'text-amber-400'
                            : 'text-slate-300 dark:text-slate-600'
                        }
                        h-5 w-5 shrink-0
                      `}
                  aria-hidden="true"
                />
              );
            })}
          </div>
        </div>
        <div className="ml-2 text-sm">
          <FormattedMessage
            id="review_summary"
            defaultMessage="<div> Based on <cta> {total} </cta> reviews</div>"
            values={{
              div: (chunks) => <div>{chunks}</div>,
              cta: (chunks) => <b className="font-semibold">{chunks}</b>,
              total: productReviews.length,
            }}
          />
        </div>
      </div>

      <div className="mt-6">
        <h3 className="sr-only">
          {formatMessage({
            id: 'review_data',
            defaultMessage: 'Review data',
          })}
        </h3>

        <dl className="space-y-3">
          <div className="flex items-center text-sm">
            <dt className="flex flex-1 items-center">
              <p className="font-medium">{totalUpVote}</p>
              <div aria-hidden="true" className="ml-2 flex flex-1 items-center">
                <HandThumbUpIcon
                  className={`
                          ${
                            totalUpVote > 0
                              ? 'text-emerald-500'
                              : 'text-slate-500'
                          }
                          h-5 w-5 shrink-0`}
                  aria-hidden="true"
                />

                <div className="relative ml-3 flex-1">
                  <div className="h-3 rounded-full border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900" />
                  {totalUpVote > 0 ? (
                    <div
                      className="absolute inset-y-0 rounded-full border border-emerald-500 bg-emerald-500"
                      style={{
                        width: `calc(${averageUpVote}%)`,
                      }}
                    />
                  ) : null}
                </div>
              </div>
            </dt>
            <dd className="ml-3 w-10 text-right text-sm tabular-nums">
              {Math.round(averageUpVote)}%
            </dd>
          </div>

          <div className="flex items-center text-sm">
            <dt className="flex flex-1 items-center">
              <p className="font-medium">
                {totalDownVote}
                <span className="sr-only">
                  {formatMessage({
                    id: 'star_reviews',
                    defaultMessage: 'Star reviews',
                  })}
                </span>
              </p>
              <div aria-hidden="true" className="ml-2 flex flex-1 items-center">
                <HandThumbDownIcon
                  className={`
                          ${
                            totalDownVote > 0
                              ? 'text-rose-500'
                              : 'text-slate-500'
                          }
                          h-5 w-5 shrink-0
                        `}
                  aria-hidden="true"
                />

                <div className="relative ml-3 flex-1">
                  <div className="h-3 rounded-full border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900" />
                  {totalDownVote > 0 ? (
                    <div
                      className="absolute inset-y-0 rounded-full border border-rose-500 bg-rose-500"
                      style={{
                        width: `calc(${averageDownVote}%)`,
                      }}
                    />
                  ) : null}
                </div>
              </div>
            </dt>
            <dd className="ml-3 w-10 text-right text-sm tabular-nums">
              {Math.round(averageDownVote)}%
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

export default ProductReviewsReport;
