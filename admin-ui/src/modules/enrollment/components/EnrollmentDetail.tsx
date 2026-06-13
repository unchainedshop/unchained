import { useMemo, useState } from 'react';
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
import DangerMessage from '../../modal/components/DangerMessage';
import EnrollmentDetailHeader from './EnrollmentDetailHeader';
import JSONView from '@/components/ui/JSONView';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import {
  IEnrollment,
  IEnrollmentStatus,
  IProductType,
  IRoleAction,
  ISortDirection,
} from '../../../gql/types';
import useAuth from '../../Auth/useAuth';
import useProducts from '../../product/hooks/useProducts';
import UnchainedSelect from '../../common/components/UnchainedSelect';
import deBounce from '../../common/utils/deBounce';

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

  const [productQuery, setProductQuery] = useState('');
  const debouncedSetProductQuery = useMemo(
    () => deBounce(200)(setProductQuery),
    [],
  );
  const { products: planProducts, loading: productsLoading } = useProducts({
    queryString: productQuery,
    limit: 20,
    sort: [{ key: 'created', value: ISortDirection.Desc }],
    types: [IProductType.PlanProduct],
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
          defaultMessage: 'Are you sure you want to this subscription?',
        })}
        onOkClick={async () => {
          setModal('');
          await activateEnrollment({ enrollmentId: enrollment?._id });
          toast.success(
            formatMessage({
              id: 'success_message',
              defaultMessage: 'Subscription successfully activated.',
            }),
          );
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

  const onTerminateEnrollment = async () => {
    await setModal(
      <DangerMessage
        onCancelClick={async () => setModal('')}
        message={formatMessage({
          id: 'terminate_enrollment_confirmation',
          defaultMessage:
            'Are you sure you want to terminate this subscription? ',
        })}
        onOkClick={async () => {
          setModal('');
          await terminateEnrollment({ enrollmentId: enrollment?._id });
          toast.success(
            formatMessage({
              id: 'terminate_enrollment_success',
              defaultMessage: 'Subscription terminated successfully',
            }),
          );
        }}
        okText={formatMessage({
          id: 'terminate_subscription',
          defaultMessage: 'Terminate subscription',
        })}
      />,
    );
  };

  const onSuspendEnrollment = async () => {
    await setModal(
      <AlertMessage
        buttonText={formatMessage({
          id: 'suspend_button',
          defaultMessage: 'Suspend',
        })}
        headerText={formatMessage({
          id: 'suspend_header',
          defaultMessage: 'Suspend subscription.',
        })}
        message={formatMessage({
          id: 'suspend_confirmation',
          defaultMessage:
            'Are you sure you want to suspend this subscription? No new orders will be generated until it is resumed.',
        })}
        onOkClick={async () => {
          setModal('');
          await suspendEnrollment({ enrollmentId: enrollment?._id });
          toast.success(
            formatMessage({
              id: 'suspend_success',
              defaultMessage: 'Subscription suspended successfully.',
            }),
          );
        }}
      />,
    );
  };

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
              'Change the plan to "{plan}"? Future periods will be regenerated.',
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
        hasRole(IRoleAction.UpdateEnrollment) && (
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
        hasRole(IRoleAction.UpdateEnrollment) && (
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
        hasRole(IRoleAction.UpdateEnrollment) && (
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
      {enrollment?.requestedTerminationDate &&
        enrollment?.status !== IEnrollmentStatus.Terminated && (
          <div className="my-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            {formatMessage(
              {
                id: 'scheduled_termination',
                defaultMessage: 'Termination scheduled for {date}',
              },
              {
                date: formatDateTime(enrollment.requestedTerminationDate, {
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
                  <UnchainedSelect
                    name="planProductId"
                    placeholder={formatMessage({
                      id: 'search_plan_product',
                      defaultMessage: 'Search plan product...',
                    })}
                    isLoading={productsLoading}
                    onChange={onChangePlan}
                    onInputChange={debouncedSetProductQuery}
                    options={planProductOptions}
                    className="w-full text-sm"
                  />
                </div>
              )}

              <div className="flex-auto border-t border-slate-300 dark:border-slate-800 pt-4 lg:col-span-6 lg:border-0">
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
