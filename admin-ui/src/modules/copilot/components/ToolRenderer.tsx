import { ReactNode } from 'react';

import renderSystemInfo from './tool-renderers/systemInfoRenderers';
import { ProductRenderers } from './tool-renderers/ProductRenderers';
import assortmentRenderers from './tool-renderers/AssortmentRenderers';

import { renderProvidersToolResponses } from './tool-renderers/providerRenderes';
import { renderOrderToolResponses } from './tool-renderers/orderRenderers';
import { renderLocalizationToolResponses } from './tool-renderers/localizationRenderes';
import renderImage from './tool-renderers/imageRenderer';
import userRenderers from './tool-renderers/userRenderers';
import filterRenderers from './tool-renderers/filterRenderers';
import { QuotationRenderers } from './tool-renderers/quotationRenderers';

type ToolRenderFn = (data: any) => ReactNode | null;

const ToolRenderer: Record<string, ToolRenderFn> = {
  system_management: renderSystemInfo,
  generateImage: renderImage,
  product_management: ProductRenderers,
  localization_management: renderLocalizationToolResponses,
  assortment_management: assortmentRenderers,
  order_management: renderOrderToolResponses,
  quotation_management: QuotationRenderers,
  provider_management: renderProvidersToolResponses,
  filter_manage: filterRenderers,
  filter_management: filterRenderers,
  users_management: userRenderers,
};

export default ToolRenderer;
