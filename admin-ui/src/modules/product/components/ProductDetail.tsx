import { useIntl } from 'react-intl';
import {
  DocumentTextIcon,
  FilmIcon,
  ShoppingBagIcon,
  ChartPieIcon,
  ArchiveBoxIcon,
  SwatchIcon,
  PresentationChartLineIcon,
  UsersIcon,
  PuzzlePieceIcon,
  LinkIcon,
  StarIcon,
} from '@heroicons/react/20/solid';
import LocaleWrapper from '../../common/components/LocaleWrapper';

import CommerceForm from './CommerceForm';
import ProductTextsForm from './ProductTextsForm';
import ProductMediaForm from './ProductMediaForm';
import SubscriptionForm from './SubscriptionForm';
import SupplyForm from './SupplyForm';
import ProductVariation from './ProductVariation';
import WarehousingForm from './WarehousingForm';
import Tab from '../../common/components/Tab';
import ProductReviews from '../../product-review/components/ProductReviews';
import BundleProducts from './BundleProducts';
import TagList from '../../common/components/TagList';
import useUpdateProduct from '../hooks/useUpdateProduct';
import { PRODUCT_TYPES } from '../ProductTypes';
import useAuth from '../../Auth/useAuth';
import ProductAssignmentForm from './ProductAssignmentForm';
import ProductTokenizationForm from './ProductTokenizationForm';
import DisplayExtendedFields from '../../common/components/DisplayExtendedFields';
import ErrorBoundary from '../../common/components/ErrorBoundary';
import { IProductDetailFragment, IProductStatus } from '../../../gql/types';

interface GetCurrentTabProps {
  id: string;
  selectedView?: string;
  disableAll?: boolean;
  [key: string]: any;
}

interface ProductDetailProps {
  product: IProductDetailFragment & { __typename?: string };
  extendedData?: Record<string, any>;
}

const GetCurrentTab = ({
  id,
  selectedView = '',
  disableAll = false,
  ...extendedData
}: GetCurrentTabProps) => {
  if (selectedView === 'texts')
    return (
      <LocaleWrapper>
        <ProductTextsForm productId={id} disabled={disableAll} />
      </LocaleWrapper>
    );
  if (selectedView === 'media')
    return (
      <ErrorBoundary>
        <LocaleWrapper>
          <ProductMediaForm productId={id} />
        </LocaleWrapper>
      </ErrorBoundary>
    );
  if (selectedView === 'commerce')
    return <CommerceForm productId={id} disabled={disableAll} />;
  if (selectedView === 'supply')
    return <SupplyForm productId={id} disabled={disableAll} />;
  if (selectedView === 'warehousing')
    return <WarehousingForm productId={id} disabled={disableAll} />;
  if (selectedView === 'variations')
    return (
      <LocaleWrapper>
        <ProductVariation productId={id} disabled={disableAll} />
      </LocaleWrapper>
    );
  if (selectedView === 'bundled_products')
    return <BundleProducts productId={id} disabled={disableAll} />;
  if (selectedView === 'subscriptions')
    return <SubscriptionForm productId={id} disabled={disableAll} />;
  if (selectedView === 'reviews') return <ProductReviews productId={id} />;
  if (selectedView === 'assignments')
    return (
      <LocaleWrapper>
        <ProductAssignmentForm proxyId={id} disabled={disableAll} />
      </LocaleWrapper>
    );

  if (selectedView === 'token') {
    return <ProductTokenizationForm productId={id} disabled={disableAll} />;
  }
  if (selectedView === 'extended') {
    return <DisplayExtendedFields data={extendedData} />;
  }
  return (
    <LocaleWrapper>
      <ProductTextsForm productId={id} />
    </LocaleWrapper>
  );
};
const ProductDetail = ({ product, extendedData = {} }: ProductDetailProps) => {
  const { formatMessage } = useIntl();
  const { hasRole } = useAuth();
  const { updateProduct } = useUpdateProduct();
  const { __typename } = product || {};

  const productOptions = [
    {
      id: 'texts',
      title: formatMessage({
        id: 'general_text',
        defaultMessage: 'Text',
      }),
      Icon: <DocumentTextIcon className="h-5 w-5" />,
    },
    {
      id: 'media',
      title: formatMessage({ id: 'media', defaultMessage: 'Media' }),
      Icon: <FilmIcon className="h-5 w-5" />,
    },
    __typename !== PRODUCT_TYPES.ConfigurableProduct && {
      id: 'commerce',
      title: formatMessage({ id: 'commerce', defaultMessage: 'Commerce' }),
      Icon: <ShoppingBagIcon className="h-5 w-5" />,
    },
    __typename === PRODUCT_TYPES.SimpleProduct && {
      id: 'supply',
      title: formatMessage({
        id: 'supply',
        defaultMessage: 'Supply',
      }),
      Icon: <ChartPieIcon className="h-5 w-5" />,
    },
    __typename === PRODUCT_TYPES.SimpleProduct && {
      id: 'warehousing',
      title: formatMessage({
        id: 'warehousing',
        defaultMessage: 'Warehousing',
      }),
      Icon: <ArchiveBoxIcon className="h-5 w-5" />,
    },
    __typename === PRODUCT_TYPES.ConfigurableProduct && {
      id: 'variations',
      title: formatMessage({
        id: 'variations',
        defaultMessage: 'Variations',
      }),
      Icon: <SwatchIcon className="h-5 w-5" />,
    },
    __typename === PRODUCT_TYPES.BundleProduct && {
      id: 'bundled_products',
      title: formatMessage({
        id: 'bundled_items',
        defaultMessage: 'Bundled items',
      }),
      Icon: <PresentationChartLineIcon className="h-5 w-5" />,
    },
    __typename === PRODUCT_TYPES.PlanProduct && {
      id: 'subscriptions',
      title: formatMessage({
        id: 'subscriptions',
        defaultMessage: 'Subscriptions',
      }),
      Icon: <UsersIcon className="h-5 w-5" />,
    },
    __typename === PRODUCT_TYPES.ConfigurableProduct && {
      id: 'assignments',
      title: formatMessage({
        id: 'assignments',
        defaultMessage: 'Assignments',
      }),
      Icon: <LinkIcon className="h-5 w-5" />,
    },
    __typename === PRODUCT_TYPES.TokenizedProduct && {
      id: 'token',
      title: formatMessage({
        id: 'token',
        defaultMessage: 'Token',
      }),
      Icon: <LinkIcon className="h-5 w-5" />,
    },
    {
      id: 'reviews',
      title: formatMessage({
        id: 'reviews',
        defaultMessage: 'Reviews',
      }),
      Icon: <StarIcon className="h-5 w-5" />,
    },
    extendedData !== null && {
      id: 'extended',
      title: formatMessage({
        id: 'extended-fields',
        defaultMessage: 'Extended',
      }),
      Icon: <PuzzlePieceIcon className="h-5 w-5" />,
    },
  ].filter((item) => item);

  const onUpdateTags = async ({ tags }) => {
    await updateProduct({ productId: product?._id, product: { tags } });
    return true;
  };

  return (
    <>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-10">
        <TagList
          defaultValue={product?.tags}
          onSubmit={onUpdateTags}
          enableEdit={hasRole('manageProducts')}
        />
      </div>
      <Tab tabItems={productOptions} defaultTab="texts">
        <GetCurrentTab
          disableAll={product?.status === IProductStatus.Deleted}
          id={product?._id}
          {...extendedData}
        />
      </Tab>
    </>
  );
};

export default ProductDetail;
