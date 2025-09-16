import Head from 'next/head';
import Link from 'next/link';
import { useIntl } from 'react-intl';
import { PlusIcon } from '@heroicons/react/24/outline';
import Button from './Button';

const PageHeader = ({
  headerText = null,
  onEdit = null,
  onDelete = null,
  children = null,
  title = null,
  addPath = null,
  addButtonText = null,
}) => {
  const { formatMessage } = useIntl();
  return (
    <>
      <Head>
        <title>Unchained AdminUI - {title || headerText} </title>
      </Head>
      <div className="flex gap-3 flex-wrap items-center justify-between">
        <div className="flex items-center flex-wrap justify-between w-full gap-4">
          {headerText && (
            <h2 className="text-2xl font-medium text-slate-900 dark:text-slate-300 sm:truncate sm:text-3xl lg:text-4xl">
              {headerText}
            </h2>
          )}
          <div className="flex items-center gap-3 flex-shrink-0">
            {children}
            {addPath && (
              <Link href={addPath}>
                <Button
                  variant="secondary"
                  icon={<PlusIcon className="h-5 w-5" />}
                  text={
                    addButtonText ||
                    formatMessage({ id: 'add', defaultMessage: 'Add' })
                  }
                />
              </Link>
            )}
            {onEdit && (
              <Button
                variant="secondary"
                onClick={onEdit}
                text={formatMessage({ id: 'edit', defaultMessage: 'Edit' })}
              />
            )}
            {onDelete && (
              <Button
                variant="danger"
                onClick={onDelete}
                text={formatMessage({ id: 'delete', defaultMessage: 'Delete' })}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PageHeader;
