import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { Context } from '../context.js';
import { SortDirection } from '@unchainedshop/utils';

export default function createMcpServer(context: Context) {
  const server = new McpServer({
    name: 'Unchained MCP Server',
    version: '1.0.0',
  });

  server.tool(
    'hello-world',
    'Say hello',
    {
      name: z.string().describe('Name of the person to greet'),
    },
    async ({ name }) => {
      // Here you would implement the logic for the Unchained tool
      return {
        content: [{ type: 'text', text: `Hello ${name}!` }],
      };
    },
  );

  server.tool(
    'list_products',
    'Search and list products with comprehensive filtering and pagination support',
    {
      // Search & Filter
      queryString: z.string().optional().describe('Text search across product fields'),
      tags: z.array(z.string()).optional().describe('Filter by product tags'),
      slugs: z.array(z.string()).optional().describe('Filter by specific product slugs'),
      productIds: z.array(z.string()).optional().describe('Filter by specific product IDs'),
      filterQuery: z.array(z.object({
        key: z.string().describe('Filter key'),
        value: z.string().optional().describe('Filter value')
      })).optional().describe('Key-value filter pairs'),
      assortmentId: z.string().optional().describe('Filter by assortment'),
      includeDrafts: z.boolean().default(false).describe('Include draft products'),
      includeInactive: z.boolean().default(false).describe('Include inactive products'),
      
      // Pagination  
      limit: z.number().min(1).max(100).default(20).describe('Results per page'),
      offset: z.number().min(0).default(0).describe('Skip results for pagination'),
      
      // Sorting
      sort: z.array(z.object({
        key: z.string().describe('Sort field'),
        value: z.enum(['ASC', 'DESC']).describe('Sort direction')
      })).optional().describe('Sort options'),
    },
    async ({ 
      queryString,
      tags,
      slugs,
      productIds,
      filterQuery,
      assortmentId,
      includeDrafts = false,
      includeInactive = false,
      limit = 20,
      offset = 0,
      sort
    }) => {
      try {
        let filteredProductIds = productIds;

        // If assortmentId is provided, get product IDs from assortment
        if (assortmentId) {
          const assortmentProductIds = await context.modules.assortments.products.findProductIds({
            assortmentId
          });
          
          if (filteredProductIds) {
            // Intersection of both sets
            filteredProductIds = filteredProductIds.filter(id => assortmentProductIds.includes(id));
          } else {
            filteredProductIds = assortmentProductIds;
          }
        }

        // Build search query
        const productQuery: any = {
          queryString,
          tags,
          slugs,
          productIds: filteredProductIds,
          includeDrafts: includeDrafts || includeInactive, // includeInactive also includes drafts
        };

        // Convert sort options to the expected format
        const sortOptions = sort?.map(({ key, value }) => ({
          key,
          value: value === 'ASC' ? SortDirection.ASC : SortDirection.DESC
        }));

        let products;
        let totalCount;

        // Use search service if we have complex filtering or text search
        if (queryString || filterQuery?.length) {
          const searchQuery = {
            queryString,
            productIds: filteredProductIds || [],
            includeInactive,
            filterQuery: filterQuery?.reduce((acc, { key, value }) => {
              acc[key] = value;
              return acc;
            }, {} as Record<string, string>) || {},
          };

          const searchResult = await context.services.searchProducts(searchQuery, { 
            locale: context.locale 
          });
          
          // Get products from search results with pagination
          const paginatedProductIds = searchResult.aggregatedFilteredProductIds.slice(offset, offset + limit);
          products = await context.modules.products.findProducts({
            productIds: paginatedProductIds,
            sort: sortOptions
          });
          totalCount = searchResult.aggregatedFilteredProductIds.length;
        } else {
          // Use direct product query for simpler cases
          products = await context.modules.products.findProducts({
            ...productQuery,
            limit,
            offset,
            sort: sortOptions
          });
          totalCount = await context.modules.products.count(productQuery);
        }

        // Build HTML output
        const htmlContent = generateProductsHTML(products, { 
          offset, 
          limit, 
          total: totalCount 
        });

        return {
          content: [{ type: 'text', text: htmlContent }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error listing products: ${error.message}` }],
        };
      }
    },
  );

  // server.resource('config', 'config://app', async (uri) => {
  //   return {
  //     contents: [
  //       {
  //         uri: uri.href,
  //         mimeType: 'application/json',
  //         text: {
  //           version: context.version,
  //         },
  //       },
  //     ],
  //   };
  // });

  return server;
}

/**
 * Generate HTML output for products list with Unchained styling
 */
function generateProductsHTML(products: any[], pagination: { offset: number; limit: number; total: number }): string {
  const { offset, total } = pagination;
  const resultsShown = products.length;
  const startIndex = offset + 1;
  const endIndex = offset + resultsShown;

  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui; max-width: 1200px;">
  <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
    <h3 style="color: #343a40; margin: 0;">Products</h3>
    <span style="color: #6c757d; font-size: 14px;">Showing ${startIndex}-${endIndex} of ${total}</span>
  </div>
  
  <div style="background: white; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
    <table style="width: 100%; border-collapse: collapse;">
      <thead style="background: #f8f9fa; border-bottom: 1px solid #e9ecef;">
        <tr>
          <th style="padding: 12px; text-align: left; font-weight: 600; color: #343a40;">Image</th>
          <th style="padding: 12px; text-align: left; font-weight: 600; color: #343a40;">Product</th>
          <th style="padding: 12px; text-align: left; font-weight: 600; color: #343a40;">SKU</th>
          <th style="padding: 12px; text-align: left; font-weight: 600; color: #343a40;">Status</th>
          <th style="padding: 12px; text-align: left; font-weight: 600; color: #343a40;">ID</th>
        </tr>
      </thead>
      <tbody>
        ${products.map((product, index) => generateProductRow(product, index)).join('')}
      </tbody>
    </table>
  </div>
</div>`;
}

function generateProductRow(product: any, index: number): string {
  const isEven = index % 2 === 0;
  const backgroundColor = isEven ? '#ffffff' : '#f8f9fa';
  
  // Get product title from texts
  const title = product.texts?.find((t: any) => t.locale === 'en')?.title || product.title || 'Untitled Product';
  
  // Get SKU from warehousing info
  const sku = product.warehousing?.sku || 'N/A';
  
  // Get status with proper formatting
  const status = product.status || 'DRAFT';
  const statusColor = status === 'ACTIVE' ? '#28a745' : status === 'DRAFT' ? '#ffc107' : '#6c757d';
  
  // Product ID (shortened for display)
  const productId = product._id?.toString() || 'N/A';
  const shortId = productId.length > 12 ? `${productId.substring(0, 12)}...` : productId;

  return `
        <tr style="background: ${backgroundColor}; border-bottom: 1px solid #e9ecef;">
          <td style="padding: 12px;">
            <div style="width: 40px; height: 40px; background: #e9ecef; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #6c757d; font-size: 12px;">
              IMG
            </div>
          </td>
          <td style="padding: 12px;">
            <div style="font-weight: 500; color: #343a40;">${escapeHtml(title)}</div>
            ${product.tags?.length ? `<div style="font-size: 12px; color: #6c757d; margin-top: 4px;">${product.tags.slice(0, 3).map((tag: string) => `<span style="background: #e9ecef; padding: 2px 6px; border-radius: 3px; margin-right: 4px;">${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
          </td>
          <td style="padding: 12px;">
            <span style="color: #343a40; font-family: monospace;">${escapeHtml(sku)}</span>
          </td>
          <td style="padding: 12px;">
            <span style="color: ${statusColor}; font-weight: 500; font-size: 12px; text-transform: uppercase; background: ${statusColor}20; padding: 4px 8px; border-radius: 12px;">${status}</span>
          </td>
          <td style="padding: 12px;">
            <span style="color: #6c757d; font-family: monospace; font-size: 12px;" title="${escapeHtml(productId)}">${escapeHtml(shortId)}</span>
          </td>
        </tr>`;
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
