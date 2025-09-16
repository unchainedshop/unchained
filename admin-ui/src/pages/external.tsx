import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';
import Link from 'next/link';
const ExternalLink = () => {
  const router = useRouter();
  const { formatMessage } = useIntl();
  const url = router.query?.url;
  const isValidUrl = typeof url === 'string' && url.trim() !== '';
  return isValidUrl ? (
    <iframe src={url} title="External Content" id="external-page" />
  ) : (
    <div className="text-center">
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-rose-500 dark:text-slate-200 sm:text-5xl">
        {formatMessage({
          id: 'invalid_url',
          defaultMessage: 'Invalid page url',
        })}
      </h1>
      <div className="mt-6">
        <Link
          href="/"
          className="text-base font-medium text-slate-950 dark:text-slate-800 hover:text-slate-900 dark:hover:text-slate-400"
        >
          {formatMessage({
            id: 'go_back_home',
            defaultMessage: 'Go back home',
          })}
          <span aria-hidden="true"> &rarr;</span>
        </Link>
      </div>
    </div>
  );
};

export default ExternalLink;
