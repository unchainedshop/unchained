import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Context } from '../../../context.js';
import { createAssortmentHandler, CreateAssortmentSchema } from './createAssortmentHandler.js';
import { AddAssortmentFilterSchema, addAssortmentFilterHandler } from './addAssortmentFilterHandler.js';
import { AddAssortmentLinkSchema, addAssortmentLinkHandler } from './addAssortmentLinkHandler.js';
import {
  AddAssortmentMediaUploadSchema,
  addAssortmentMediaUploadHandler,
} from './addAssortmentMediaUploadHandler.js';
import {
  AddAssortmentProductSchema,
  addAssortmentProductHandler,
} from './addAssortmentProductHandler.js';
import { AssortmentChildrenSchema, assortmentChildrenHandler } from './assortmentChildrenHandler.js';
import { AssortmentFiltersSchema, assortmentFiltersHandler } from './assortmentFiltersHandler.js';
import { AssortmentSchema, assortmentHandler } from './assortmentHandler.js';
import { AssortmentLinksSchema, assortmentLinksHandler } from './assortmentLinksHandler.js';
import { AssortmentProductsSchema, assortmentProductsHandler } from './assortmentProductsHandler.js';
import { AssortmentsCountSchema, assortmentsCountHandler } from './assortmentsCountHandler.js';
import { AssortmentsSchema, assortmentsHandler } from './assortmentsHandler.js';
import {
  RemoveAssortmentFilterSchema,
  removeAssortmentFilterHandler,
} from './removeAssortmentFilterHandler.js';
import { RemoveAssortmentSchema, removeAssortmentHandler } from './removeAssortmentHandler.js';
import {
  RemoveAssortmentLinkSchema,
  removeAssortmentLinkHandler,
} from './removeAssortmentLinkHandler.js';
import {
  RemoveAssortmentMediaSchema,
  removeAssortmentMediaHandler,
} from './removeAssortmentMediaHandler.js';
import {
  RemoveAssortmentProductSchema,
  removeAssortmentProductHandler,
} from './removeAssortmentProductHandler.js';
import {
  ReorderAssortmentFiltersSchema,
  reorderAssortmentFiltersHandler,
} from './reorderAssortmentFiltersHandler.js';
import {
  ReorderAssortmentLinksSchema,
  reorderAssortmentLinksHandler,
} from './reorderAssortmentLinksHandler.js';
import {
  ReorderAssortmentMediaSchema,
  reorderAssortmentMediaHandler,
} from './reorderAssortmentMediaHandler.js';
import {
  ReorderAssortmentProductsSchema,
  reorderAssortmentProductsHandler,
} from './reorderAssortmentProductsHandler.js';
import {
  SearchAssortmentProductSchema,
  searchAssortmentProductHandler,
} from './searchAssortmentProductHandler.js';
import { SetBaseAssortmentSchema, setBaseAssortmentHandler } from './setBaseAssortmentHandler.js';
import {
  TranslatedAssortmentMediaTextsSchema,
  translatedAssortmentMediaTextsHandler,
} from './translatedAssortmentMediaTextsHandler.js';
import {
  TranslatedAssortmentTextsSchema,
  translatedAssortmentTextsHandler,
} from './translatedAssortmentTextsHandler.js';
import { UpdateAssortmentSchema, updateAssortmentHandler } from './updateAssortmentHandler.js';
import {
  UpdateAssortmentMediaTextsSchema,
  updateAssortmentMediaTextsHandler,
} from './updateAssortmentMediaTextsHandler.js';
import {
  UpdateAssortmentTextsSchema,
  updateAssortmentTextsHandler,
} from './updateAssortmentTextsHandler.js';

export const registerAssortmentTools = (server: McpServer, context: Context) => {
  server.tool(
    'assortment_create',
    'Create a new assortment with optional localized texts.',
    CreateAssortmentSchema,
    async (params) => createAssortmentHandler(context, params),
  );

  server.tool(
    'assortment_update',
    'Update fields of an existing assortment by ID.',
    UpdateAssortmentSchema,
    async (params) => updateAssortmentHandler(context, params),
  );

  server.tool(
    'assortment_remove',
    'Remove an assortment by ID.',
    RemoveAssortmentSchema,
    async (params) => removeAssortmentHandler(context, params),
  );

  server.tool(
    'assortment_setBase',
    'Makes the provided assortment the base assortment and resets others to regular.',
    SetBaseAssortmentSchema,
    async (params) => setBaseAssortmentHandler(context, params),
  );

  server.tool(
    'assortment_get',
    'Fetch details of an assortment by ID or slug.',
    AssortmentSchema,
    async (params) => assortmentHandler(context, params),
  );

  server.tool(
    'assortment_list',
    'List assortments with filtering, pagination, and sorting options.',
    AssortmentsSchema,
    async (params) => assortmentsHandler(context, params),
  );

  server.tool(
    'assortment_count',
    'Count assortments matching given filters.',
    AssortmentsCountSchema,
    async (params) => assortmentsCountHandler(context, params),
  );

  server.tool(
    'assortment_getChildren',
    'Fetch child assortments for a given assortment ID (or root-level assortments if none is provided).',
    AssortmentChildrenSchema,
    async (params) => assortmentChildrenHandler(context, params),
  );

  server.tool(
    'assortment_getProducts',
    'Fetch products for a given assortment, optionally including inactive ones.',
    AssortmentProductsSchema,
    async (params) => assortmentProductsHandler(context, params),
  );

  server.tool(
    'assortment_searchProducts',
    'Search products within an assortment with optional filtering and pagination.',
    SearchAssortmentProductSchema,
    async (params) => searchAssortmentProductHandler(context, params),
  );

  server.tool(
    'assortment_getLinks',
    'Fetch parent and child links for a given assortment_',
    AssortmentLinksSchema,
    async (params) => assortmentLinksHandler(context, params),
  );

  server.tool(
    'assortment_getFilters',
    'Fetch filters associated with a specific assortment_',
    AssortmentFiltersSchema,
    async (params) => assortmentFiltersHandler(context, params),
  );

  server.tool(
    'assortment_addProduct',
    'Add a product to an assortment with optional tags.',
    AddAssortmentProductSchema,
    async (params) => addAssortmentProductHandler(context, params),
  );

  server.tool(
    'assortment_removeProduct',
    'Remove a product from an assortment_',
    RemoveAssortmentProductSchema,
    async (params) => removeAssortmentProductHandler(context, params),
  );

  server.tool(
    'assortment_reorderProducts',
    'Reorder assortment products by assigning new sort keys.',
    ReorderAssortmentProductsSchema,
    async (params) => reorderAssortmentProductsHandler(context, params),
  );

  server.tool(
    'assortment_linkChild',
    'Create a parent-child relationship between two assortments, with optional tags.',
    AddAssortmentLinkSchema,
    async (params) => addAssortmentLinkHandler(context, params),
  );

  server.tool(
    'assortment_removeLink',
    'Remove a link between assortments by ID.',
    RemoveAssortmentLinkSchema,
    async (params) => removeAssortmentLinkHandler(context, params),
  );

  server.tool(
    'assortment_reorderLinks',
    'Reorder assortment links by assigning new sort keys.',
    ReorderAssortmentLinksSchema,
    async (params) => reorderAssortmentLinksHandler(context, params),
  );

  server.tool(
    'assortment_reorderMedia',
    'Reorder assortment media assets with new sorting keys; first item becomes primary media.',
    ReorderAssortmentMediaSchema,
    async (params) => reorderAssortmentMediaHandler(context, params),
  );

  server.tool(
    'assortment_addMedia',
    'Upload and link a media asset (e.g., image or video) to an assortment_',
    AddAssortmentMediaUploadSchema,
    async (params) => addAssortmentMediaUploadHandler(context, params),
  );

  server.tool(
    'assortment_removeMedia',
    'Remove a media asset previously attached to an assortment_',
    RemoveAssortmentMediaSchema,
    async (params) => removeAssortmentMediaHandler(context, params),
  );

  server.tool(
    'assortmentMedia_updateTexts',
    'Update localized texts for a specific assortment media asset.',
    UpdateAssortmentMediaTextsSchema,
    async (params) => updateAssortmentMediaTextsHandler(context, params),
  );

  server.tool(
    'assortmentMedia_getTexts',
    'Retrieve translated texts associated with a specific assortment media asset.',
    TranslatedAssortmentMediaTextsSchema,
    async (params) => translatedAssortmentMediaTextsHandler(context, params),
  );

  server.tool(
    'assortment_getTexts',
    'Retrieve translated texts for a specific assortment_',
    TranslatedAssortmentTextsSchema,
    async (params) => translatedAssortmentTextsHandler(context, params),
  );

  server.tool(
    'assortment_updateTexts',
    'Update localized texts (title, subtitle, description, slug) of an assortment for one or more locales.',
    UpdateAssortmentTextsSchema,
    async (params) => updateAssortmentTextsHandler(context, params),
  );

  server.tool(
    'assortment_addFilter',
    'Attach a filter to a specific assortment, optionally tagging the relation.',
    AddAssortmentFilterSchema,
    async (params) => addAssortmentFilterHandler(context, params),
  );

  server.tool(
    'assortment_removeFilter',
    'Remove a filter from an assortment_',
    RemoveAssortmentFilterSchema,
    async (params) => removeAssortmentFilterHandler(context, params),
  );

  server.tool(
    'assortment_reorderFilters',
    'Reorder assortment filters by assigning new sort keys.',
    ReorderAssortmentFiltersSchema,
    async (params) => reorderAssortmentFiltersHandler(context, params),
  );
};
