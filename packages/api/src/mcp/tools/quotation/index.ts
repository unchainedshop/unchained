import type { McpServer } from '@modelcontextprotocol/server';
import type { Context } from '../../../context.ts';
import { quotationManagement, QuotationManagementSchema } from './quotationManagement.ts';

export const registerQuotationTools = (server: McpServer, context: Context) => {
  server.registerTool(
    'quotation_management',
    {
      description:
        'Unified quotation management system. Supports: LIST (get quotations with filters and pagination), GET (single quotation by ID), COUNT (count quotations), VERIFY (verify a REQUESTED quotation), MAKE_PROPOSAL (create proposal for PROCESSING quotation), REJECT (reject any quotation except FULFILLED). Quotations go through lifecycle: REQUESTED → PROCESSING → PROPOSED → FULFILLED/REJECTED.',
      inputSchema: QuotationManagementSchema,
    },
    async (params) => quotationManagement(context, params),
  );
};
