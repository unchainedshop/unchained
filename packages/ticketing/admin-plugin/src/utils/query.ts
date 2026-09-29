// Batches a single-id query into one request for several ids. Pure, so it runs in node --test.
import type { DocumentNode } from 'graphql';

const ALIAS = 'item';

// Renames every variable (definitions and uses) by appending suffix; drops source locations.
const withVariableSuffix = (node: unknown, suffix: string): any => {
  if (Array.isArray(node)) return node.map((child) => withVariableSuffix(child, suffix));
  if (!node || typeof node !== 'object') return node;
  const copy = Object.fromEntries(
    Object.entries(node)
      .filter(([key]) => key !== 'loc')
      .map(([key, value]) => [key, withVariableSuffix(value, suffix)]),
  );
  if (copy.kind === 'Variable') copy.name = { ...copy.name, value: `${copy.name.value}${suffix}` };
  return copy;
};

/**
 * Repeats the root fields of a query once per item, aliased `item<index>` and with the variables
 * suffixed by the index: `product(productId: $productId)` becomes `item0: product(productId:
 * $productId0) item1: …`. The single-id query stays the one that is validated against the schema.
 */
export function batchQuery(document: DocumentNode, count: number): DocumentNode {
  const operation: any = document.definitions.find(({ kind }) => kind === 'OperationDefinition');
  const items = Array.from({ length: count }, (_, index) => withVariableSuffix(operation, `${index}`));
  return {
    kind: 'Document' as DocumentNode['kind'],
    definitions: [
      {
        ...items[0],
        variableDefinitions: items.flatMap((item) => item.variableDefinitions),
        selectionSet: {
          ...items[0].selectionSet,
          selections: items.flatMap((item, index) =>
            item.selectionSet.selections.map((field) => ({
              ...field,
              alias: { kind: 'Name', value: `${ALIAS}${index}` },
            })),
          ),
        },
      },
    ],
  };
}

/** The variables of batchQuery: the variables of each item with the item's index appended. */
export const batchVariables = (items: Record<string, unknown>[]) =>
  Object.fromEntries(
    items.flatMap((variables, index) =>
      Object.entries(variables).map(([name, value]) => [`${name}${index}`, value]),
    ),
  );

/** The result of each item of batchQuery, in order. */
export const batchResults = <T = any>(data: Record<string, T> | null | undefined, count: number) =>
  Array.from({ length: count }, (_, index) => data?.[`${ALIAS}${index}`]);
