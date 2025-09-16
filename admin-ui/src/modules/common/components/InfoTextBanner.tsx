import { InformationCircleIcon } from '@heroicons/react/24/outline';

const InfoTextBanner = ({ title = null, description }) => {
  return (
    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="flex items-start gap-3">
        <InformationCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div>
          {title && (
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              {title}
            </h3>
          )}
          <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InfoTextBanner;
