import { useIntl } from 'react-intl';
import Accordion from '../../common/components/Accordion';
import AccordionHeader from '../../common/components/AccordionHeader';
import Badge from '../../common/components/Badge';
import JSONView from '../../common/components/JSONView';
import NoData from '../../common/components/NoData';

import useFormatDateTime from '../../common/utils/useFormatDateTime';

const EventDetail = ({ event }) => {
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();

  const dataEvent = {
    header: (
      <AccordionHeader
        name={formatMessage({ id: 'payload', defaultMessage: 'Payload' })}
      />
    ),
    body: event?.payload ? (
      <JSONView
        disabled
        value={JSON.stringify(event.payload, null, 2)}
        className="bg-white dark:bg-slate-900 dark:text-slate-200 mt-1 block w-full max-w-full rounded-md border-1 resize-none border-slate-300 dark:border-slate-800 shadow-xs sm:text-sm"
      />
    ) : (
      <NoData
        className="bg-white dark:bg-slate-900 rounded-lg capitalize border border-slate-300 dark:border-slate-800"
        message={formatMessage({
          id: `no_payload`,
          defaultMessage: 'Payload',
        })}
      />
    ),
  };

  const headerCSS =
    'inline-flex items-center justify-between w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-800 shadow-md text-sm font-medium text-slate-700 hover:bg-slate-50 focus:z-10 focus:outline-hidden focus:ring-2 focus:ring-slate-800  ';

  return (
    <>
      <div className="mt-5 rounded-lg border border-slate-300 dark:border-slate-800 p-4 shadow-sm sm:p-6 lg:p-8">
        <div className="flex justify-between ">
          <div className="my-1 pb-1 text-sm  font-semibold">
            {formatMessage({
              id: 'type_colon',
              defaultMessage: 'Type:',
            })}
            <span className="ml-2">
              <Badge text={event.type} square className="p-2" color="slate" />
            </span>
          </div>
          <div className="my-1 pb-1 font-mono text-lg">
            <span className="ml-2 font-semibold">
              {formatDateTime(new Date(event?.created), {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
            </span>
          </div>
        </div>
        <div>
          <Accordion data={[dataEvent]} headerCSS={headerCSS} />
        </div>
      </div>
    </>
  );
};

export default EventDetail;
