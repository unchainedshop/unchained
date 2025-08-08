import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Context } from '../../../context.js';
import { AssortmentComponentsSchema, assortmentComponents } from './assortmentComponents.js';
import { AssortmentCrudSchema, assortmentCrud } from './assortmentCrud.js';
import { AssortmentReorderingSchema, assortmentReordering } from './assortmentReordering.js';
import { AssortmentTextsSchema, assortmentTexts } from './assortmentTexts.js';
import {
  AddAssortmentMediaUploadSchema,
  addAssortmentMediaUploadHandler,
} from './addAssortmentMediaUploadHandler.js';
import { AssortmentChildrenSchema, assortmentChildrenHandler } from './assortmentChildrenHandler.js';
import { AssortmentGettersSchema, assortmentGetters } from './assortmentGetters.js';
import {
  SearchAssortmentProductSchema,
  searchAssortmentProductHandler,
} from './searchAssortmentProductHandler.js';
import { SetBaseAssortmentSchema, setBaseAssortmentHandler } from './setBaseAssortmentHandler.js';

export const registerAssortmentTools = (server: McpServer, context: Context) => {
  server.tool(
    'assortment_crud',
    'Unified handler for assortment CRUD operations - CREATE new assortments with texts, UPDATE existing ones, REMOVE by ID, GET single assortments, LIST with filters/pagination, COUNT totals',
    AssortmentCrudSchema,
    async (params) => assortmentCrud(context, params),
  );

  server.tool(
    'assortment_components',
    'Unified handler for managing assortment components - ADD/REMOVE products, filters, links, and media with proper validation and error handling',
    AssortmentComponentsSchema,
    async (params) => assortmentComponents(context, params),
  );

  server.tool(
    'assortment_reordering',
    'Unified handler for reordering assortment components - reorder PRODUCTS, FILTERS, LINKS, or MEDIA with new sort keys/positions (first media item becomes primary)',
    AssortmentReorderingSchema,
    async (params) => assortmentReordering(context, params),
  );

  // Unified text management
  server.tool(
    'assortment_texts',
    'Unified handler for assortment text management - UPDATE/GET localized texts for assortments and their media assets',
    AssortmentTextsSchema,
    async (params) => assortmentTexts(context, params),
  );

  // Keep specialized handlers that don't fit unified patterns
  server.tool(
    'assortment_getChildren',
    'Fetch child assortments for a given assortment ID (or root-level assortments if none is provided).',
    AssortmentChildrenSchema,
    async (params) => assortmentChildrenHandler(context, params),
  );

  server.tool(
    'assortment_getters',
    'Unified handler to retrieve assortment components - get PRODUCTS, FILTERS, LINKS, or MEDIA with proper filtering and normalization',
    AssortmentGettersSchema,
    async (params) => assortmentGetters(context, params),
  );

  server.tool(
    'assortment_searchProducts',
    'Search products within an assortment with optional filtering and pagination.',
    SearchAssortmentProductSchema,
    async (params) => searchAssortmentProductHandler(context, params),
  );

  server.tool(
    'assortment_setBase',
    'Makes the provided assortment the base assortment and resets others to regular.',
    SetBaseAssortmentSchema,
    async (params) => setBaseAssortmentHandler(context, params),
  );

  server.tool(
    'assortment_addMedia',
    'Upload and link a media asset (e.g., image or video) to an assortment.',
    AddAssortmentMediaUploadSchema,
    async (params) => addAssortmentMediaUploadHandler(context, params),
  );
};
