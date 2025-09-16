import classNames from 'classnames';
import { useRouter } from 'next/router';

import { FormattedMessage, useIntl } from 'react-intl';
import { DefaultLimit, LimitSteps } from '../data/miscellaneous';
import Button from './Button';
import Loading from './Loading';

const MobilePaginator = ({
  onOffsetChange,
  onLimitChange,
  offset,
  limit,
  total,
}) => {
  const { formatMessage } = useIntl();

  return (
    <div className="flex h-8 flex-1 justify-between sm:hidden">
      <button
        type="button"
        disabled={!offset}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onOffsetChange(offset - limit);
        }}
        className={classNames(
          'relative inline-flex items-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600',
          {
            'text-slate-200': !offset,
            'text-slate-700': offset,
          },
        )}
      >
        {formatMessage({ id: 'previous', defaultMessage: 'Previous' })}{' '}
      </button>
      <div className="flex justify-between sm:justify-end">
        <div>
          <select
            onChange={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onLimitChange(parseInt(e.target.value, 10));
            }}
            id="location"
            defaultValue={DefaultLimit}
            name="location"
            className="block h-8 w-full rounded-md dark:bg-slate-400 border-slate-300 dark:border-slate-700 py-0 text-base  focus:outline-hidden focus:ring-slate-800 sm:text-sm"
          >
            {LimitSteps.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        type="button"
        disabled={offset + limit >= total}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onOffsetChange(offset + limit);
        }}
        className={classNames(
          'relative ml-3 inline-flex items-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium  hover:bg-slate-50 dark:hover:bg-slate-600',
          {
            'text-slate-200': offset + limit >= total,
            'text-slate-700': offset + limit < total,
          },
        )}
      >
        {formatMessage({ id: 'next', defaultMessage: 'Next' })}
      </button>
    </div>
  );
};

const Step = ({ onClick, disabled = false, label }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current="page"
      disabled={disabled}
      className={classNames(
        'relative inline-flex items-center border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium  hover:bg-slate-50 ',
        {
          'z-10 border-slate-900 bg-slate-50 text-slate-800 dark:bg-slate-600 dark:border-slate-400 dark:text-slate-200':
            disabled,
          'text-slate-500 dark:hover:bg-slate-600 dark:text-slate-400 dark:hover:text-slate-100':
            !disabled,
        },
      )}
    >
      {label}
    </button>
  );
};

const Pagination = ({
  total = 0,
  data = [],
  onLoadMore = null,
  isLoading = false,
}) => {
  const { formatMessage } = useIntl();
  const router = useRouter();
  const limit = parseInt(router.query?.limit as string, 10) || DefaultLimit;
  const offset = parseInt(router.query?.skip as string, 10) || 0;

  const currentPage = offset === 0 ? 1 : Math.ceil((offset + 1) / limit);

  const changeOffset = (newOffset) => {
    router.push(
      {
        query: { ...router.query, skip: newOffset },
      },
      undefined,
      { scroll: false },
    );
  };

  const changeLimit = (newLimit) => {
    router.push(
      {
        query: { ...router.query, limit: newLimit },
      },
      undefined,
      { scroll: false },
    );
  };

  const addStep = (number) => {
    const stepOffset = number - 1;
    return (
      <Step
        key={`start-${stepOffset}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          changeOffset(limit * stepOffset);
        }}
        aria-current="page"
        disabled={currentPage === number}
        label={number}
      />
    );
  };

  const Steps = (): any => {
    const steps = [];
    const pages = total ? Math.ceil(total / limit) : 0;
    const center = [
      currentPage - 2,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      currentPage + 2,
    ];

    const filteredCenter = center
      .filter((p) => p > 1 && p < pages)
      .map((a) => addStep(a));

    const includeThreeLeft = currentPage === 5;
    const includeThreeRight = currentPage === pages - 4;
    const includeLeftDots = currentPage > 5;
    const includeRightDots = currentPage < pages - 4;

    if (includeThreeLeft) filteredCenter.unshift(addStep(2));
    if (includeThreeRight) filteredCenter.push(addStep(pages - 1));

    if (includeLeftDots)
      filteredCenter.unshift(
        <Step
          key="dash-1"
          aria-current="page"
          onClick={(e) => {
            e.stopPropagation();
          }}
          label="..."
        />,
      );
    if (includeRightDots)
      filteredCenter.push(
        <Step
          key="dash-2"
          aria-current="page"
          onClick={(e) => {
            e.stopPropagation();
          }}
          label="..."
        />,
      );
    steps.push(addStep(1));

    steps.push(...filteredCenter);

    if (pages > 1) {
      steps.push(addStep(pages));
    }
    return steps;
  };

  return (
    <div className="flex items-center justify-between pe-4 py-3">
      {total !== data?.length && data?.length && onLoadMore ? (
        !isLoading ? (
          <Button
            text={formatMessage({
              id: 'load_more',
              defaultMessage: 'Load more',
            })}
            onClick={onLoadMore}
            className="py-2 leading-5"
          />
        ) : (
          <Loading />
        )
      ) : null}

      {!onLoadMore ? (
        <>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div className="sm:block">
              {!total ? (
                formatMessage({
                  id: 'no_result_found',
                  defaultMessage: 'No result found',
                })
              ) : (
                <FormattedMessage
                  id="paginated-data"
                  defaultMessage="<p> Showing <span>{from}</span> to <span>{to}</span> of <span>{total}</span> results </p>"
                  values={{
                    p: (chunks) => (
                      <p className="text-sm text-slate-700 dark:text-slate-400">
                        {chunks}
                      </p>
                    ),
                    span: (chunks) => (
                      <span className="font-medium">{chunks}</span>
                    ),
                    to: offset + data.length,
                    from: offset || 1,
                    total,
                  }}
                />
              )}
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex h-8 -space-x-px rounded-md shadow-xs"
                aria-label="Pagination"
              >
                <button
                  type="button"
                  disabled={!offset}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    changeOffset(offset - limit);
                  }}
                  className={classNames(
                    'relative inline-flex items-center rounded-l-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-2 text-sm font-medium  hover:bg-slate-50 dark:hover:bg-slate-600',
                    {
                      'text-slate-200': !offset,
                      'text-slate-600': offset,
                    },
                  )}
                >
                  <span className="sr-only">
                    {formatMessage({
                      id: 'previous',
                      defaultMessage: 'Previous',
                    })}{' '}
                  </span>
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <Steps />

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    changeOffset(offset + limit);
                  }}
                  disabled={offset + limit >= total}
                  className={classNames(
                    'relative inline-flex items-center rounded-r-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-2 text-sm font-medium  hover:bg-slate-50 dark:hover:bg-slate-600',
                    {
                      'text-slate-200': offset + limit >= total,
                      'text-slate-500': offset + limit < total,
                    },
                  )}
                >
                  <span className="sr-only">
                    {formatMessage({ id: 'next', defaultMessage: 'Next' })}
                  </span>
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </nav>
            </div>
          </div>

          <MobilePaginator
            offset={offset}
            limit={limit}
            total={total}
            onLimitChange={changeLimit}
            onOffsetChange={changeOffset}
          />
        </>
      ) : null}

      <div className="hidden justify-between sm:block sm:justify-end">
        <div>
          <select
            onChange={(e) => {
              e.preventDefault();
              e.stopPropagation();
              changeLimit(parseInt(e.target.value, 10));
            }}
            id="location"
            defaultValue={limit}
            name="location"
            className="block h-8 w-full rounded-md text-slate-500 dark:text-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 py-0 text-base  focus:outline-hidden focus:ring-slate-800 sm:text-sm"
          >
            {LimitSteps.map((l) => (
              <option key={l} value={l} className="dark:text-slate-100">
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
