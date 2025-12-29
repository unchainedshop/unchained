import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Context } from '../../../context.ts';
import { quotationManagement, QuotationManagementSchema } from './quotationManagement.ts';

export const registerQuotationTools = (server: McpServer, context: Context) => {
  server.tool(
    'quotation_management',
    'Unified quotation management system. Supports: LIST (get quotations with filters and pagination), GET (single quotation by ID), COUNT (count quotations), REQUEST (create new quotation request for a product), VERIFY (verify a REQUESTED quotation), MAKE_PROPOSAL (create proposal for PROCESSING quotation), REJECT (reject any quotation except FULFILLED). Quotations go through lifecycle: REQUESTED → PROCESSING → PROPOSED → FULFILLED/REJECTED.',
    QuotationManagementSchema,
    async (params) => quotationManagement(context, params),
  );
};
