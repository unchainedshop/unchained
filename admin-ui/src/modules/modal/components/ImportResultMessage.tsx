import React from 'react';
import { useIntl } from 'react-intl';
import Button from '../../common/components/Button';

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

interface ImportResultMessageProps {
  result: ImportResult;
  onClose: () => void;
  title?: string;
  entityName?: string;
}

const ImportResultMessage: React.FC<ImportResultMessageProps> = ({
  result,
  onClose,
  title,
  entityName = 'items',
}) => {
  const { formatMessage } = useIntl();

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">
        {title ||
          formatMessage({
            id: 'import_results',
            defaultMessage: 'Import Results',
          })}
      </h3>

      <p className="text-green-600">
        {formatMessage(
          {
            id: 'items_imported',
            defaultMessage: '{count} {entityName} imported successfully',
          },
          {
            count: result.success,
            entityName,
          },
        )}
      </p>

      {result.failed > 0 && (
        <div>
          <p className="text-red-600 mt-2">
            {formatMessage(
              {
                id: 'items_failed',
                defaultMessage: '{count} {entityName} failed to import',
              },
              {
                count: result.failed,
                entityName,
              },
            )}
          </p>
          <div className="mt-2 max-h-40 overflow-y-auto">
            {result.errors.slice(0, 10).map((err, i) => (
              <p key={i} className="text-sm text-red-500">
                {err}
              </p>
            ))}
            {result.errors.length > 10 && (
              <p className="text-sm text-gray-500">
                ... and {result.errors.length - 10} more errors
              </p>
            )}
          </div>
        </div>
      )}

      <Button
        onClick={onClose}
        className="mt-4"
        text={formatMessage({ id: 'close', defaultMessage: 'Close' })}
      />
    </div>
  );
};

export default ImportResultMessage;
