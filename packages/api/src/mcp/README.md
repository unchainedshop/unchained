# MCP Server

This directory contains the Model Context Protocol (MCP) server implementation for Unchained Commerce.

## Structure

```
mcp/
├── index.ts              # Main MCP server setup
├── types.ts              # Shared type definitions
├── tools/                # Individual tool implementations
│   ├── index.ts          # Re-exports for all tools
│   └── listProducts.ts   # List products tool
└── utils/                # Shared utilities
    └── html.ts           # HTML generation utilities
```

## Adding New Tools

To add a new tool:

1. Create a new file in the `tools/` directory
2. Export the schema and handler from the file
3. Add the exports to `tools/index.ts`
4. Register the tool in the main `index.ts` file
