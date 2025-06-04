/**
 * HTML generation utilities for MCP server responses
 */

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generate HTML output for products list with Unchained styling
 */
export function generateProductsHTML(
  products: any[],
  productTexts: any[],
  pagination: { offset: number; limit: number; total: number },
): string {
  const { offset, total } = pagination;
  const resultsShown = products.length;
  const startIndex = offset + 1;
  const endIndex = offset + resultsShown;

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body>
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
      </div>
    </body>
  </html>`;
}

/**
 * Generate a single product row for the HTML table
 */
function generateProductRow(product: any, index: number): string {
  const isEven = index % 2 === 0;
  const backgroundColor = isEven ? '#ffffff' : '#f8f9fa';

  // Get product title from texts
  const title =
    product.texts?.find((t: any) => t.locale === 'en')?.title || product.title || 'Untitled Product';

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
            ${
              product.tags?.length
                ? `<div style="font-size: 12px; color: #6c757d; margin-top: 4px;">${product.tags
                    .slice(0, 3)
                    .map(
                      (tag: string) =>
                        `<span style="background: #e9ecef; padding: 2px 6px; border-radius: 3px; margin-right: 4px;">${escapeHtml(tag)}</span>`,
                    )
                    .join('')}</div>`
                : ''
            }
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
