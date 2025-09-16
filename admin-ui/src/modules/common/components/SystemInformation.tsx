import { useIntl } from 'react-intl';
import useShopInfo from '../hooks/useShopInfo';
import Badge from './Badge';
import Loading from './Loading';

const ShopInformation = () => {
  const { formatMessage, locale } = useIntl();
  const { shopInfo, loading } = useShopInfo();

  if (loading) return <Loading />;
  return (
    <>
      <h2 className="ml-4 mb-6 text-xl text-slate-900 dark:text-slate-200">
        {formatMessage({
          id: 'system_information',
          defaultMessage: 'System Information',
        })}
      </h2>
      <div className="mt-2 text-right">
        <div className="bg-white dark:bg-slate-800 p-4 shadow-sm dark:shadow-none sm:rounded-lg sm:px-4">
          <ul className="-my-3 divide-y divide-slate-200 dark:divide-slate-700">
            <li className="py-4">
              <div className="flex items-center space-x-4">
                <div className="shrink-0 dark:text-slate-400">
                  {formatMessage({
                    id: 'engine_version',
                    defaultMessage: 'Engine version',
                  })}
                </div>
                <div className="min-w-0 flex-1">
                  <Badge text={shopInfo?.version} color="slate" square />
                </div>
              </div>
            </li>
            <li className="py-4">
              <div className="flex items-center space-x-4">
                <div className="shrink-0 dark:text-slate-400">
                  {formatMessage({
                    id: 'resolved_language',
                    defaultMessage: 'Resolved language',
                  })}
                </div>
                <div className="min-w-0 flex-1">
                  {(shopInfo?.language?.isoCode &&
                    new Intl.DisplayNames([locale], {
                      type: 'language',
                    }).of(shopInfo?.language?.isoCode)) ||
                    shopInfo?.language?.name}{' '}
                  ({shopInfo?.language?.isoCode})
                </div>
              </div>
            </li>
            <li className="py-4">
              <div className="flex items-center space-x-4">
                <div className="shrink-0 dark:text-slate-400">
                  {formatMessage({
                    id: 'resolved_country',
                    defaultMessage: 'Resolved country',
                  })}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="mr-1">{shopInfo?.country?.flagEmoji}</span>
                  {(shopInfo?.country?.isoCode &&
                    new Intl.DisplayNames([locale], { type: 'region' }).of(
                      shopInfo?.country?.isoCode,
                    )) ||
                    shopInfo?.country?.name}{' '}
                  ({shopInfo?.country?.isoCode})
                </div>
              </div>
            </li>
            <li className="py-4">
              <div className="flex items-center space-x-4">
                <div className="shrink-0 dark:text-slate-400">
                  {formatMessage({
                    id: 'default_currency',
                    defaultMessage: 'Default currency',
                  })}
                </div>
                <div className="min-w-0 flex-1">
                  {(shopInfo?.country?.defaultCurrency?.isoCode &&
                    new Intl.DisplayNames([locale], {
                      type: 'currency',
                    }).of(shopInfo?.country?.defaultCurrency?.isoCode)) ||
                    shopInfo?.country?.defaultCurrency?._id}{' '}
                  ({shopInfo?.country?.defaultCurrency?.isoCode})
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default ShopInformation;
