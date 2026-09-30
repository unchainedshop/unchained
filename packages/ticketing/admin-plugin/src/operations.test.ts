// Guards the shape of the GraphQL operations in hooks/: the ticketing schema test validates them
// against the schema, this file checks that they stay light enough to poll at a gate.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { Kind, parse, print, visit, type FieldNode, type OperationDefinitionNode } from 'graphql';
import { batchQuery } from './utils/query.ts';

const hooks = new URL('./hooks/', import.meta.url);
const TEMPLATE = new RegExp('gql' + '`([\\s\\S]*?)`', 'g');

const operations = new Map<string, OperationDefinitionNode>();
for (const file of readdirSync(hooks).filter((name) => name.endsWith('.ts'))) {
  for (const [, source] of readFileSync(new URL(file, hooks), 'utf8').matchAll(TEMPLATE)) {
    for (const definition of parse(source).definitions) {
      if (definition.kind === 'OperationDefinition' && definition.name) {
        operations.set(definition.name.value, definition);
      }
    }
  }
}

const findField = (operation: OperationDefinitionNode, name: string) => {
  let found: FieldNode | undefined;
  visit(operation, {
    Field(node) {
      if (!found && node.name.value === name) found = node;
    },
  });
  assert.ok(found, `${operation.name?.value} selects ${name}`);
  return found!;
};

const argumentNames = (field: FieldNode) => field.arguments?.map(({ name }) => name.value) ?? [];

const selects = (field: FieldNode, name: string) => {
  let found = false;
  visit(field, {
    Field(node) {
      if (node !== field && node.name.value === name) found = true;
    },
  });
  return found;
};

test('tickets are redeemed through scanTicket with the event of the gate', () => {
  assert.equal(existsSync(new URL('useInvalidateTicket.ts', hooks)), false);
  assert.ok(existsSync(new URL('useScanTicket.ts', hooks)));
  const scan = findField(operations.get('ScanTicket')!, 'scanTicket');
  assert.deepEqual(argumentNames(scan).sort(), ['accessKey', 'productId', 'tokenId']);
  for (const field of ['ticketStatus', 'attendeeName', 'invalidatedDate']) {
    assert.ok(selects(scan, field), field);
  }
});

test('gate staff look tickets up by code, serial or name within the gate event', () => {
  const lookup = findField(operations.get('TicketLookup')!, 'ticketLookup');
  assert.deepEqual(argumentNames(lookup).sort(), ['code', 'limit', 'productId']);
  for (const field of ['ticketStatus', 'attendeeName', 'cancelledDate', 'isInvalidateable', 'product']) {
    assert.ok(selects(lookup, field), field);
  }
});

test('lists never ask the warehousing adapter about every single ticket', () => {
  assert.ok(operations.size >= 10);
  for (const [name, operation] of operations) {
    visit(operation, {
      Field(node) {
        if (node.name.value === 'tokens') {
          assert.equal(selects(node, 'isInvalidateable'), false, `${name} tokens.isInvalidateable`);
        }
      },
    });
  }
});

test("the gate event picker loads today's events without their tickets", () => {
  const events = findField(operations.get('GateEvents')!, 'ticketEvents');
  for (const arg of ['slotFrom', 'slotTo', 'onlyInvalidateable', 'sort', 'limit']) {
    assert.ok(argumentNames(events).includes(arg), arg);
  }
  assert.equal(selects(events, 'tokens'), false);
  for (const field of ['event', 'startsAt', 'location', 'category', 'tokensCount']) {
    assert.ok(selects(events, field), field);
  }
});

test('the event list pages and sorts by event start instead of loading everything', () => {
  const operation = operations.get('TicketEvents')!;
  const events = findField(operation, 'ticketEvents');
  for (const arg of ['limit', 'offset', 'sort', 'slotFrom', 'slotTo', 'queryString']) {
    assert.ok(argumentNames(events).includes(arg), arg);
  }
  assert.ok(selects(events, 'event'));
  assert.ok(selects(events, 'category'));
  const count = findField(operation, 'ticketEventsCount');
  for (const arg of ['slotFrom', 'slotTo', 'queryString']) {
    assert.ok(argumentNames(count).includes(arg), arg);
  }
});

test('the event detail shows attendee, buyer and ticket status and edits the event', () => {
  const tokens = findField(operations.get('TicketEventDetail')!, 'tokens');
  for (const field of ['attendeeName', 'ticketStatus', 'cancelledDate', 'invalidatedDate', 'user']) {
    assert.ok(selects(tokens, field), field);
  }
  const update = findField(operations.get('UpdateTicketEvent')!, 'updateTicketEvent');
  assert.deepEqual(argumentNames(update).sort(), ['event', 'productId']);
});

test('a gate for several events loads them and their tickets in one request', () => {
  const batched = batchQuery(
    { kind: Kind.DOCUMENT, definitions: [operations.get('GateEventDetail')!] },
    3,
  ).definitions[0] as OperationDefinitionNode;
  assert.deepEqual(
    batched.selectionSet.selections.map((field: FieldNode) => [
      field.alias?.value,
      field.name.value,
      print(field.arguments![0]),
    ]),
    [
      ['item0', 'product', 'productId: $productId0'],
      ['item1', 'product', 'productId: $productId1'],
      ['item2', 'product', 'productId: $productId2'],
    ],
  );
  const tokens = findField(batched, 'tokens');
  for (const field of ['ticketStatus', 'attendeeName', 'invalidatedDate']) {
    assert.ok(selects(tokens, field), field);
  }
});

test('productions are listed and shown without loading tickets', () => {
  for (const name of ['TicketProductions', 'TicketProductionDetail']) {
    const operation = operations.get(name)!;
    assert.ok(operation, name);
    assert.equal(selects(findField(operation, 'ticketProduction'), 'tokens'), false, name);
    let loadsTokens = false;
    visit(operation, {
      Field(node) {
        if (node.name.value === 'tokens') loadsTokens = true;
      },
    });
    assert.equal(loadsTokens, false, `${name} tokens`);
  }
  for (const name of [
    'CreateTicketProduction',
    'UpdateTicketProduction',
    'PublishTicketProduction',
    'UnpublishTicketProduction',
    'RemoveTicketProduction',
    'AddTicketPerformance',
    'UpdateTicketPerformance',
    'RemoveTicketPerformance',
    'CancelTicketPerformance',
    'AddTicketCategory',
    'UpdateTicketCategory',
    'RemoveTicketCategory',
  ]) {
    assert.ok(operations.get(name), name);
  }
});
