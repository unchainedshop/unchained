import { useIntl } from 'react-intl';
import useFormatDateTime from '../utils/useFormatDateTime';
import ImageWithFallback from './ImageWithFallback';
import Toggle from './Toggle';

const isBoolean = (value) => {
  try {
    return typeof JSON.parse(value) === 'boolean';
  } catch {
    return false;
  }
};

const isImageURL = (value) => {
  try {
    const { pathname } = new URL(value);
    const parts = pathname?.split('.');
    const ext = `.${parts[parts.length - 1]}`;

    return ['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(ext);
  } catch {
    return false;
  }
};

const isURL = (value) => {
  try {
    return new URL(value);
  } catch {
    return false;
  }
};

const isValidDate = (dateString) => {
  return (
    !Number.isNaN(Date.parse(dateString)) && Number.isNaN(Number(dateString))
  );
};

const DisplayData = ({ value }) => {
  const { formatDateTime } = useFormatDateTime();
  const { formatMessage } = useIntl();
  if (isURL(value)) {
    if (isImageURL(value)) {
      return (
        <div className="ring-2 ring-offset-2 ring-slate-900 group block w-full aspect-w-10 aspect-h-7 rounded-lg bg-slate-50 overflow-hidden">
          <ImageWithFallback
            src={value}
            className="relative h-10 w-10 rounded-full"
            width={100}
            height={100}
            alt={formatMessage({
              id: 'image_not_available',
              defaultMessage: 'Image not available',
            })}
          />
        </div>
      );
    }

    return (
      <div className="ml-4 shrink-0">
        <a
          href={value}
          className="font-medium text-slate-900 hover:text-slate-800"
          target="_blank"
          rel="noreferrer"
        >
          {new URL(value).host}...{new URL(value).pathname}
        </a>
      </div>
    );
  }
  if (isBoolean(value)) return <Toggle disabled active={JSON.parse(value)} />;

  if (isValidDate(value))
    return formatDateTime(value, {
      dateStyle: 'long',
      timeStyle: 'short',
    });
  if (!Number.isNaN(value)) return value;
  return value;
};

const DisplayLabel = ({ value }) => {
  return (
    <h3 className="text-base font-medium">
      <span className="text-slate-900">{value}</span>
    </h3>
  );
};

const DisplayExtendedFields = (props) => {
  const { data, parentKey } = props;
  if (!data) return null;

  const keys = Object.keys(data);
  const elements = [];

  if (parentKey !== undefined) {
    elements.push(<DisplayLabel value={parentKey} key={parentKey} />);
  }

  keys.forEach((key) => {
    const value = data[key];

    if (Array.isArray(value)) {
      elements.push(<DisplayLabel value={key} key={key} />);
      if (value.every((v) => typeof v === 'string' || typeof v === 'number')) {
        elements.push(
          <div key={key} className="  p-2">
            {value?.map((item) => (
              <span
                key={item}
                className="inline-flex items-center rounded-md bg-slate-50 px-2.5 py-0.5 text-sm font-medium text-slate-800 ml-2"
              >
                <DisplayData value={item} />
              </span>
            ))}
          </div>,
        );
      } else {
        const listItems = [];
        value.forEach((item, i) => {
          listItems.push(
            <li
              key={i}
              className="flex items-center text-slate-600  justify-between py-3 pl-3 pr-4 text-sm"
            >
              {DisplayExtendedFields({ data: item, parentKey: i })}
            </li>,
          );
        });
        elements.push(
          <ul key={key} className="divide-y divide-slate-200 rounded-md ">
            {listItems}
          </ul>,
        );
      }
    } else if (typeof value === 'object') {
      elements.push(DisplayExtendedFields({ data: value, parentKey: key }));
    } else if (parentKey === undefined) {
      elements.push(
        <div key={key} className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
          <dt className="text-sm font-medium text-slate-700">
            <DisplayLabel value={key} key={key} />
          </dt>
          <dd className="mt-1 text-sm text-slate-900 sm:col-span-2 sm:mt-0">
            <DisplayData value={value} />
          </dd>
        </div>,
      );
    } else {
      elements.push(
        <div
          key={key}
          className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6"
        >
          <dt className="text-sm font-medium text-slate-700">
            <DisplayLabel value={key} key={key} />
          </dt>
          <dd className="mt-1 text-sm text-slate-900 sm:col-span-2 sm:mt-0">
            <DisplayData value={value} />
          </dd>
        </div>,
      );
    }
  });

  return (
    <div className=" bg-white  px-4 py-5 ">
      <dl>{elements}</dl>
    </div>
  );
};

export default DisplayExtendedFields;
