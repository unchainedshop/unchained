import CopilotMediaList from './CopilotMediaList';
import ProductItemWrapperCompact from './ProductItemWrapperCompact';

const CopilotProductMedia = ({ product }) => {
  return (
    <ProductItemWrapperCompact product={product}>
      <CopilotMediaList media={product?.media} />
    </ProductItemWrapperCompact>
  );
};

export default CopilotProductMedia;
