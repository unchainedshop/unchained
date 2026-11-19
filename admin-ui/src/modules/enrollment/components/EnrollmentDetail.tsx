import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useIntl } from 'react-intl';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { InboxIcon } from '@heroicons/react/24/outline';

import useFormatDateTime from '../../common/utils/useFormatDateTime';
import useStatusTypes from '../../common/hooks/useStatusTypes';
import StatusProgress from '../../common/components/StatusProgress';
import Accordion from '@/components/ui/Accordion/Accordion';
import { getInterfaceLabel } from '../../common/utils/utils';
import defaultNextImageLoader from '../../common/utils/defaultNextImageLoader';
import SubscriptionList from './SubscriptionList';
import Button from '@/components/ui/Button';
import useActivateEnrollment from '../hooks/useActivateEnrollment';
import useModal from '../../modal/hooks/useModal';
import AlertMessage from '../../modal/components/AlertMessage';
import useTerminateEnrollment from '../hooks/useTerminateEnrollment';
import useSuspendEnrollment from '../hooks/useSuspendEnrollment';
import useSendEnrollmentEmail from '../hooks/useSendEnrollmentEmail';
import useUpdateEnrollmentPlan from '../hooks/useUpdateEnrollmentPlan';
import useUpdateEnrollmentExpires from '../hooks/useUpdateEnrollmentExpires';
import EnrollmentDetailHeader from './EnrollmentDetailHeader';
import EnrollmentActionForm from './EnrollmentActionForm';
import JSONView from '@/components/ui/JSONView';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import {
  IEnrollment,
  IEnrollmentStatus,
  IEnrollmentTerminationReason,
  IProductType,
  IRoleAction,
  ISortDirection,
} from '../../../gql/types';
import useAuth from '../../Auth/useAuth';
import useProducts from '../../product/hooks/useProducts';
import Combobox from '@/components/ui/form/Combobox';
import DatePickerField from '@/components/ui/form/DatePickerField';
import SelectField from '@/components/ui/form/SelectField';
import TextAreaField from '@/components/ui/form/TextAreaField';
import deBounce from '../../common/utils/deBounce';
import getGraphQLError from '../../common/utils/getGraphQLError';

const toDateTime = (date?: string | null) =>
  date ? new Date(`${date}T00:00`).toISOString() : null;

const toLocalDate = (dateTime: unknown) =>
  dateTime ? format(new Date(dateTime as string), 'yyyy-MM-dd') : null;

const EnrollmentDetail = ({ enrollment }: { enrollment: IEnrollment }) => {
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();
  const { setModal } = useModal();
  const { hasRole } = useAuth();

  const { statusTypes: enrollmentStatusTypes } =
    useStatusTypes('EnrollmentStatus');
  const { activateEnrollment } = useActivateEnrollment();
  const { terminateEnrollment } = useTerminateEnrollment();
  const { suspendEnrollment } = useSuspendEnrollment();
  const { sendEnrollmentEmail } = useSendEnrollmentEmail();
  const { updateEnrollmentPlan } = useUpdateEnrollmentPlan();
  const { updateEnrollmentExpires } = useUpdateEnrollmentExpires();

  const [productQuery, setProductQuery] = useState('');
  const debouncedSetProductQuery = useMemo(
    () => deBounce(200)(setProductQuery),
    [],
  );
  const { products: planProducts, loading: productsLoading } = useProducts({
    queryString: productQuery,
    limit: 20,
    includeDrafts: false,
    sort: [{ key: 'created', value: ISortDirection.Desc }],
    type: IProductType.PlanProduct,
  });

  const planProductOptions = useMemo(
    () =>
      (planProducts || []).map((p: any) => ({
        value: p._id,
        label: p.texts?.title || p._id,
      })),
    [planProducts],
  );

  if (!enrollment) return null;

  const onActivateEnrollment = async () => {
    await setModal(
      <AlertMessage
        buttonText={formatMessage({
          id: 'activate_button',
          defaultMessage: 'Activate',
        })}
        headerText={formatMessage({
          id: 'activate_header_title',
          defaultMessage: 'Activate subscription.',
        })}
        message={formatMessage({
          id: 'activate_header_conformation',
          defaultMessage:
            'Are you sure you want to activate this subscription?',
        })}
        onOkClick={async () => {
          setModal('');
          try {
            await activateEnrollment({ enrollmentId: enrollment?._id });
            toast.success(
              formatMessage({
                id: 'success_message',
                defaultMessage: 'Subscription successfully activated.',
              }),
            );
          } catch (error) {
            toast.error(getGraphQLError(error)?.message);
          }
        }}
      />,
    );
  };

  const EmailIcon = (
    <div className="flex w-full items-center justify-center">
      <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 sm:mx-0 sm:h-10 sm:w-10">
        <InboxIcon
          className="h-6 w-6 text-slate-900 dark:text-blue-400"
          aria-hidden="true"
        />
      </div>
    </div>
  );

  const onSendEnrollmentEmail = async () => {
    await setModal(
      <AlertMessage
        icon={EmailIcon}
        buttonText={formatMessage({
          id: 'send_button',
          defaultMessage: 'Send',
        })}
        headerText={formatMessage({
          id: 'send_activation_email_header',
          defaultMessage: 'Send Email.',
        })}
        message={formatMessage({
          id: 'send_activation_email_confirm',
          defaultMessage: 'Are you sure you want to send email?',
        })}
        onOkClick={async () => {
          setModal('');
          const { data } = await sendEnrollmentEmail({
            email: enrollment?.contact.emailAddress,
          });
          if (data?.sendEnrollmentEmail?.success)
            toast.success(
              formatMessage({
                id: 'enrollment_success_message',
                defaultMessage: 'Subscription activation email sent',
              }),
            );
          else
            toast.error(
              formatMessage({
                id: 'terminate_enrollment_error',
                defaultMessage:
                  'Failed when sending subscription activation email, please try again',
              }),
            );
        }}
      />,
    );
  };

  const terminationReasons: Record<IEnrollmentTerminationReason, string> = {
    [IEnrollmentTerminationReason.UserRequested]: formatMessage({
      id: 'termination_reason_user_requested',
      defaultMessage: 'Requested by the customer',
    }),
    [IEnrollmentTerminationReason.PaymentFailed]: formatMessage({
      id: 'termination_reason_payment_failed',
      defaultMessage: 'Payment failed',
    }),
    [IEnrollmentTerminationReason.Expired]: formatMessage({
      id: 'termination_reason_expired',
      defaultMessage: 'Expired',
    }),
    [IEnrollmentTerminationReason.AdminAction]: formatMessage({
      id: 'termination_reason_admin_action',
      defaultMessage: 'Administrative action',
    }),
    [IEnrollmentTerminationReason.Other]: formatMessage({
      id: 'termination_reason_other',
      defaultMessage: 'Other',
    }),
  };

  const onTerminateEnrollment = async () => {
    await setModal(
      <EnrollmentActionForm
        headerText={formatMessage({
          id: 'terminate_subscription',
          defaultMessage: 'Terminate subscription',
        })}
        message={formatMessage({
          id: 'terminate_enrollment_confirmation',
          defaultMessage:
            'Are you sure you want to terminate this subscription? ',
        })}
        submitText={formatMessage({
          id: 'terminate_subscription',
          defaultMessage: 'Terminate subscription',
        })}
        initialValues={{ reason: '', comment: '' }}
        onCancel={() => setModal('')}
        onSubmit={async ({ reason, comment }) => {
          const { data } = await terminateEnrollment({
            enrollmentId: enrollment._id,
            reason: reason || null,
            comment: comment || null,
          });
          const { status, expires } = data?.terminateEnrollment || {};
          toast.success(
            status === IEnrollmentStatus.Terminated
              ? formatMessage({
                  id: 'terminate_enrollment_success',
                  defaultMessage: 'Subscription terminated successfully',
                })
              : formatMessage(
                  {
                    id: 'scheduled_termination',
                    defaultMessage: 'Termination scheduled for {date}',
                  },
                  { date: formatDateTime(expires, { dateStyle: 'full' }) },
                ),
          );
          return { success: true };
        }}
      >
        <SelectField
          name="reason"
          label={formatMessage({
            id: 'cancellation_reason',
            defaultMessage: 'Cancellation reason',
          })}
          placeholder={formatMessage({
            id: 'cancellation_reason',
            defaultMessage: 'Cancellation reason',
          })}
          options={terminationReasons}
        />
        <TextAreaField
          name="comment"
          rows={3}
          label={formatMessage({
            id: 'cancellation_comment',
            defaultMessage: 'Comment',
          })}
        />
      </EnrollmentActionForm>,
    );
  };

  const onSuspendEnrollment = async () => {
    await setModal(
      <EnrollmentActionForm
        headerText={formatMessage({
          id: 'suspend_header',
          defaultMessage: 'Suspend subscription.',
        })}
        message={formatMessage({
          id: 'suspend_confirmation',
          defaultMessage:
            'Are you sure you want to suspend this subscription? No new orders will be generated until it is resumed.',
        })}
        submitText={formatMessage({
          id: 'suspend_button',
          defaultMessage: 'Suspend',
        })}
        initialValues={{ resumeAt: null }}
        onCancel={() => setModal('')}
        onSubmit={async ({ resumeAt }) => {
          await suspendEnrollment({
            enrollmentId: enrollment._id,
            resumeAt: toDateTime(resumeAt),
          });
          toast.success(
            formatMessage({
              id: 'suspend_success',
              defaultMessage: 'Subscription suspended successfully.',
            }),
          );
          return { success: true };
        }}
      >
        <DatePickerField
          name="resumeAt"
          label={formatMessage({
            id: 'resume_at_label',
            defaultMessage: 'Resume automatically on (optional)',
          })}
        />
      </EnrollmentActionForm>,
    );
  };

  const onSetEndDate = async () => {
    await setModal(
      <EnrollmentActionForm
        headerText={formatMessage({
          id: 'set_end_date_header',
          defaultMessage: 'Set end date',
        })}
        message={formatMessage({
          id: 'set_end_date_message',
          defaultMessage:
            'The subscription ends on this date. Unlike a termination, no notice period or minimum commitment applies.',
        })}
        submitText={formatMessage({ id: 'save', defaultMessage: 'Save' })}
        initialValues={{ expires: toLocalDate(enrollment.expires) }}
        onCancel={() => setModal('')}
        onSubmit={async ({ expires }) => {
          await updateEnrollmentExpires({
            enrollmentId: enrollment._id,
            expires: toDateTime(expires),
          });
          toast.success(
            formatMessage({
              id: 'end_date_updated',
              defaultMessage: 'End date updated',
            }),
          );
          return { success: true };
        }}
      >
        <DatePickerField
          name="expires"
          required
          label={formatMessage({ id: 'end_date', defaultMessage: 'End date' })}
        />
      </EnrollmentActionForm>,
    );
  };

  const onRemoveEndDate = async () => {
    await setModal(
      <AlertMessage
        buttonText={formatMessage({
          id: 'remove_end_date',
          defaultMessage: 'Remove end date',
        })}
        headerText={formatMessage({
          id: 'remove_end_date',
          defaultMessage: 'Remove end date',
        })}
        message={formatMessage({
          id: 'remove_end_date_message',
          defaultMessage:
            'The subscription renews again until it is terminated.',
        })}
        onOkClick={async () => {
          setModal('');
          try {
            await updateEnrollmentExpires({
              enrollmentId: enrollment._id,
              expires: null,
            });
            toast.success(
              formatMessage({
                id: 'end_date_updated',
                defaultMessage: 'End date updated',
              }),
            );
          } catch (error) {
            toast.error(getGraphQLError(error)?.message);
          }
        }}
      />,
    );
  };

  const canManageEndDate =
    enrollment.status !== IEnrollmentStatus.Terminated &&
    hasRole(IRoleAction.ManageEnrollments);

  const onChangePlan = async (option: { value: string; label: string }) => {
    if (!option) return;
    await setModal(
      <AlertMessage
        buttonText={formatMessage({
          id: 'change_plan_button',
          defaultMessage: 'Change Plan',
        })}
        headerText={formatMessage({
          id: 'change_plan_header',
          defaultMessage: 'Change subscription plan',
        })}
        message={formatMessage(
          {
            id: 'change_plan_confirmation',
            defaultMessage:
              'Change the plan to "{plan}"? It applies from the next billing period on.',
          },
          { plan: option.label },
        )}
        onOkClick={async () => {
          setModal('');
          try {
            await updateEnrollmentPlan({
              enrollmentId: enrollment._id,
              plan: {
                productId: option.value,
                quantity: enrollment.plan?.quantity || 1,
              },
            });
            toast.success(
              formatMessage({
                id: 'change_plan_success',
                defaultMessage: 'Plan changed successfully.',
              }),
            );
          } catch (e: any) {
            toast.error(e.message || 'Plan change failed');
          }
        }}
      />,
    );
  };

  const canChangePlan =
    enrollment.status !== IEnrollmentStatus.Initial &&
    enrollment.status !== IEnrollmentStatus.Terminated &&
    enrollment.status !== IEnrollmentStatus.Suspended &&
    hasRole(IRoleAction.UpdateEnrollment);

  const timeline = {
    INITIAL: {
      id: 1,
      content: 'created',
      visible: true,
    },
    ACTIVE: {
      id: 2,
      content: 'updated',
      visible: true,
      Component: enrollment?.status === IEnrollmentStatus.Active &&
        hasRole(IRoleAction.ManageEnrollments) && (
          <Button
            text={formatMessage({
              id: 'suspend',
              defaultMessage: 'Suspend',
            })}
            onClick={onSuspendEnrollment}
            className="bg-white-300 relative -ml-px inline-flex items-center space-x-2 rounded-md border border-blue-500 bg-blue-500 px-2 py-1 text-base font-medium text-white hover:bg-blue-700 focus:outline-hidden focus:ring-0"
          />
        ),
    },
    SUSPENDED: {
      id: 3,
      content: 'updated',
      visible: true,
      Component: enrollment?.status === IEnrollmentStatus.Suspended &&
        hasRole(IRoleAction.ManageEnrollments) && (
          <Button
            text={formatMessage({
              id: 'resume',
              defaultMessage: 'Resume',
            })}
            onClick={onActivateEnrollment}
            className="bg-white-300 relative -ml-px inline-flex items-center space-x-2 rounded-md border border-slate-900 dark:border-slate-600 bg-slate-800 dark:bg-slate-600 px-2 py-1 text-base font-medium text-white hover:bg-slate-950 dark:hover:bg-slate-500 focus:outline-hidden focus:ring-0"
          />
        ),
    },
    PAUSED: {
      id: 4,
      content: 'updated',
      visible: true,
      Component: enrollment?.status === IEnrollmentStatus.Paused &&
        hasRole(IRoleAction.ManageEnrollments) && (
          <Button
            text={formatMessage({
              id: 'activate',
              defaultMessage: 'Activate',
            })}
            onClick={onActivateEnrollment}
            className="bg-white-300 relative -ml-px inline-flex items-center space-x-2 rounded-md border border-accent bg-accent px-2 py-1 text-base font-medium text-text-on-accent hover:bg-accent-hover  dark:focus:border-slate-400 focus:outline-hidden focus:ring-0 focus:ring-focus-ring"
          />
        ),
    },
    TERMINATED: {
      id: 5,
      content: 'updated',
      visible: true,
      Component: enrollment?.status !== IEnrollmentStatus.Terminated &&
        hasRole(IRoleAction.UpdateEnrollment) && (
          <Button
            text={formatMessage({
              id: 'terminate_enrollment',
              defaultMessage: 'Terminate Enrollment',
            })}
            onClick={onTerminateEnrollment}
            className="bg-white-300  inline-flex items-center space-x-2 rounded-md border border-rose-500 bg-rose-500 px-2 py-1 text-base font-medium text-white hover:bg-rose-700 focus:border-rose-400 focus:outline-hidden focus:ring-0 focus:ring-rose-400"
          />
        ),
    },
  };

  const headerCSS =
    'inline-flex items-center justify-between w-full px-4 py-2 rounded-t-md border border-slate-300 bg-slate-50 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:z-10 focus:outline-hidden focus:ring-2 focus:ring-focus-ring ';

  const periods = {
    header: (
      <span className="flex">
        {formatMessage({
          id: 'periods',
          defaultMessage: 'Periods',
        })}
      </span>
    ),
    body: <SubscriptionList periods={enrollment?.periods} />,
  };

  return (
    <>
      <EnrollmentDetailHeader enrollment={enrollment} />
      {enrollment?.expires &&
        enrollment?.status !== IEnrollmentStatus.Terminated && (
          <div className="my-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            {formatMessage(
              {
                id: 'scheduled_termination',
                defaultMessage: 'Termination scheduled for {date}',
              },
              {
                date: formatDateTime(enrollment.expires, {
                  dateStyle: 'full',
                  timeStyle: 'short',
                }),
              },
            )}
          </div>
        )}
      {enrollment?.resumeAt &&
        enrollment?.status === IEnrollmentStatus.Suspended && (
          <div className="my-2 rounded-md border border-blue-300 bg-blue-50 p-3 text-sm text-blue-800">
            {formatMessage(
              {
                id: 'resumes_automatically',
                defaultMessage: 'Resumes automatically on {date}',
              },
              {
                date: formatDateTime(enrollment.resumeAt, {
                  dateStyle: 'full',
                  timeStyle: 'short',
                }),
              },
            )}
          </div>
        )}
      {enrollment?.minimumCommitmentEnd &&
        enrollment?.status !== IEnrollmentStatus.Terminated && (
          <div className="my-2 rounded-md border border-blue-300 bg-blue-50 p-3 text-sm text-blue-800">
            {formatMessage(
              {
                id: 'minimum_commitment',
                defaultMessage: 'Minimum commitment until {date}',
              },
              {
                date: formatDateTime(enrollment.minimumCommitmentEnd, {
                  dateStyle: 'full',
                  timeStyle: 'short',
                }),
              },
            )}
          </div>
        )}
      <StatusProgress
        data={enrollment}
        statusTypes={enrollmentStatusTypes}
        timeline={timeline}
      />

      <section className="rounded-md border border-slate-300 bg-white">
        <div className="mx-auto -mt-12 max-w-7xl px-4 pb-4 sm:px-6 sm:pb-16 lg:px-8">
          <dl className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 sm:gap-y-8 lg:max-w-none lg:grid-cols-3 lg:gap-x-8">
            <div className="w flex flex-auto flex-col gap-y-4 gap-x-8 sm:col-span-2 sm:gap-y-8 lg:col-span-3 lg:grid-cols-12 lg:flex-row">
              <div className="flex flex-auto flex-col gap-y-8 pt-4 lg:col-span-6">
                <span className="h relative h-48 w-full rounded-lg">
                  <ImageWithFallback
                    loader={defaultNextImageLoader}
                    src={enrollment?.plan?.product?.media?.[0]?.file?.url}
                    alt={enrollment?.plan?.product?.texts?.title}
                    layout="fill"
                    objectFit="contain"
                  />
                </span>
                <div className="flex flex-col">
                  <dt className="font-medium text-slate-900">
                    {formatMessage({
                      id: 'product_title',
                      defaultMessage: 'Product',
                    })}
                  </dt>
                  <dd className="my-2 text-sm text-slate-500">
                    {enrollment?.plan.product?.texts?.title}
                  </dd>
                  <dt className="font-medium text-slate-900">
                    {formatMessage({
                      id: 'product_quantity',
                      defaultMessage: 'Quantity',
                    })}
                  </dt>
                  <dd className="my-2 text-sm text-slate-500">
                    {enrollment?.plan?.quantity}
                  </dd>
                </div>
              </div>
              {canChangePlan && (
                <div className="flex-auto border-t border-border-default pt-4 lg:col-span-6 lg:border-0">
                  <dt className="font-medium text-slate-900 mb-2">
                    {formatMessage({
                      id: 'change_plan',
                      defaultMessage: 'Change Plan',
                    })}
                  </dt>
                  <Combobox
                    name="planProductId"
                    placeholder={formatMessage({
                      id: 'search_plan_product',
                      defaultMessage: 'Search plan product...',
                    })}
                    isLoading={productsLoading}
                    onChange={(value) => {
                      const option = planProductOptions.find(
                        ({ value: optionValue }) => optionValue === value,
                      );
                      if (option) void onChangePlan(option);
                    }}
                    onSearch={debouncedSetProductQuery}
                    options={planProductOptions}
                    className="w-full text-sm"
                  />
                </div>
              )}

              <div className="flex-auto border-t border-border-default pt-4 lg:col-span-6 lg:border-0">
                <JSONView
                  disabled
                  className="bg-surface-input dark:text-slate-200 mt-1 block w-full max-w-full rounded-md border-1 resize-none border-border-default shadow-xs sm:text-sm"
                  value={JSON.stringify(
                    (enrollment?.plan.configuration || []).map(
                      ({ __typename, ...rest }: any) => rest,
                    ),
                    null,
                    2,
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:gap-y-8 lg:col-span-2 lg:grid-cols-2 lg:gap-x-8">
              <div className="border-t border-border-default pt-4">
                <dt className="font-medium text-slate-900">
                  {formatMessage({
                    id: 'payment_provider',
                    defaultMessage: 'Payment provider',
                  })}
                </dt>
                <dd className="mt-2 text-sm text-slate-500">
                  <Link
                    href={`/payment-provider?paymentProviderId=${enrollment?.payment?.provider?._id}`}
                    className="text-text-primary"
                  >
                    {getInterfaceLabel(
                      enrollment?.payment?.provider?.interface,
                    )}
                  </Link>
                </dd>
              </div>

              <div className="border-t border-border-default pt-4">
                <dt className="font-medium text-slate-900">
                  {formatMessage({
                    id: 'delivery_provider',
                    defaultMessage: 'Delivery Provider',
                  })}
                </dt>
                <dd className="mt-2 text-sm text-slate-500">
                  <Link
                    href={`/delivery-provider?deliveryProviderId=${enrollment?.delivery?.provider?._id}`}
                    className="text-text-primary"
                  >
                    {getInterfaceLabel(
                      enrollment?.delivery?.provider?.interface,
                    )}
                  </Link>
                </dd>
              </div>
              {enrollment?.contact && (
                <div className="col-span-1 border-t border-border-default pt-4">
                  <div className="font-medium text-slate-900">
                    {formatMessage({
                      id: 'contact',
                      defaultMessage: 'Contact',
                    })}
                  </div>
                  <div className="mt-2 text-sm text-slate-500">
                    {enrollment?.contact?.telNumber}
                  </div>
                  <div className="mt-2 text-sm text-slate-500">
                    {enrollment?.contact?.emailAddress}
                  </div>
                  {enrollment?.contact?.emailAddress &&
                    hasRole(IRoleAction.UpdateEnrollment) && (
                      <Button
                        text={formatMessage({
                          id: 'send_email_button',
                          defaultMessage: 'Send Email',
                        })}
                        className="px-2 py-1"
                        onClick={onSendEnrollmentEmail}
                      />
                    )}
                </div>
              )}
              <div className="border-t border-border-default pt-4">
                <dt className="font-medium text-slate-900">
                  {formatMessage({
                    id: 'contract_start',
                    defaultMessage: 'Contract start',
                  })}
                </dt>
                <dd className="mt-2 text-sm text-slate-500">
                  {enrollment?.contractStartDate
                    ? formatDateTime(enrollment.contractStartDate, {
                        dateStyle: 'medium',
                      })
                    : '-'}
                </dd>
              </div>
              <div className="border-t border-border-default pt-4">
                <dt className="font-medium text-slate-900">
                  {formatMessage({
                    id: 'end_date',
                    defaultMessage: 'End date',
                  })}
                </dt>
                <dd className="mt-2 text-sm text-slate-500">
                  {enrollment?.expires
                    ? formatDateTime(enrollment.expires, {
                        dateStyle: 'medium',
                      })
                    : formatMessage({
                        id: 'renews_automatically',
                        defaultMessage: 'Renews automatically',
                      })}
                </dd>
                {canManageEndDate && (
                  <div className="mt-2 flex gap-2">
                    <Button
                      text={
                        enrollment?.expires
                          ? formatMessage({
                              id: 'change',
                              defaultMessage: 'Change',
                            })
                          : formatMessage({
                              id: 'set_end_date_header',
                              defaultMessage: 'Set end date',
                            })
                      }
                      variant="secondary"
                      className="px-2 py-1"
                      onClick={onSetEndDate}
                    />
                    {enrollment?.expires && (
                      <Button
                        text={formatMessage({
                          id: 'remove_end_date',
                          defaultMessage: 'Remove end date',
                        })}
                        variant="secondary"
                        className="px-2 py-1"
                        onClick={onRemoveEndDate}
                      />
                    )}
                  </div>
                )}
              </div>
              {enrollment?.cancellationReason && (
                <div className="border-t border-border-default pt-4">
                  <dt className="font-medium text-slate-900">
                    {formatMessage({
                      id: 'cancellation_reason',
                      defaultMessage: 'Cancellation reason',
                    })}
                  </dt>
                  <dd className="mt-2 text-sm text-slate-500">
                    {terminationReasons[enrollment.cancellationReason]}
                  </dd>
                  {enrollment?.cancellationComment && (
                    <dd className="mt-2 text-sm text-slate-500">
                      {enrollment.cancellationComment}
                    </dd>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-border-default pt-4">
              <dt className="font-medium text-slate-900">
                {formatMessage({
                  id: 'billing_address',
                  defaultMessage: 'Billing address',
                })}
              </dt>
              <dd className="mt-2 text-sm text-slate-500">
                {enrollment?.billingAddress?.firstName}&nbsp;&nbsp;
                {enrollment?.billingAddress?.lastName}
              </dd>
              <dd className="mt-2 text-sm text-slate-500">
                {enrollment?.billingAddress?.company}
              </dd>
              <dd className="mt-2 text-sm text-slate-500">
                {enrollment?.billingAddress?.addressLine}
              </dd>
              <dd className="mt-2 text-sm text-slate-500">
                {enrollment?.billingAddress?.addressLine2}
              </dd>
              <dd className="mt-2 text-sm text-slate-500">
                {enrollment?.billingAddress?.postalCode}
              </dd>
              <dd className="mt-2 text-sm text-slate-500">
                {enrollment?.billingAddress?.city}&nbsp;&nbsp;
                {enrollment?.billingAddress?.regionCode}&nbsp;&nbsp;
                {enrollment?.billingAddress?.countryCode}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <Accordion data={[periods]} headerCSS={headerCSS} />
    </>
  );
};

export default EnrollmentDetail;
