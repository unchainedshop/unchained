import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  findSamePerformance,
  formatGateEventIds,
  parseGateEventIds,
  summarizeGateEvents,
} from './gate-events.ts';

test('parseGateEventIds reads the events of a gate from the URL', () => {
  assert.deepEqual(parseGateEventIds(undefined), []);
  assert.deepEqual(parseGateEventIds(''), []);
  assert.deepEqual(parseGateEventIds('adults'), ['adults']);
  assert.deepEqual(parseGateEventIds('adults, reduced,,adults'), ['adults', 'reduced']);
  // Next.js hands repeated query parameters over as an array.
  assert.deepEqual(parseGateEventIds(['adults', 'reduced,kids']), ['adults', 'reduced', 'kids']);
  assert.equal(formatGateEventIds(['adults', 'reduced']), 'adults,reduced');
  assert.deepEqual(parseGateEventIds(formatGateEventIds(['adults', 'reduced'])), ['adults', 'reduced']);
});

const event = (_id: string, details = {}, overrides = {}) => ({
  _id,
  texts: { title: 'Hamlet' },
  event: { startsAt: '2026-10-01T18:00:00.000Z', location: 'Main stage', ...details },
  ...overrides,
});

test('findSamePerformance finds the products sold for one performance', () => {
  const adults = event('adults', { category: 'Adults' });
  const reduced = event('reduced', { category: 'Reduced' });
  const matinee = event('matinee', { startsAt: '2026-10-01T14:00:00.000Z' });
  const otherStage = event('other-stage', { location: 'Studio' });
  const otherShow = event('other-show', {}, { texts: { title: 'Faust' } });
  const events = [matinee, adults, otherShow, reduced, otherStage];
  assert.deepEqual(
    findSamePerformance(events, adults).map(({ _id }) => _id),
    ['adults', 'reduced'],
  );
  assert.deepEqual(
    findSamePerformance(events, reduced).map(({ _id }) => _id),
    ['adults', 'reduced'],
  );
  assert.deepEqual(
    findSamePerformance(events, matinee).map(({ _id }) => _id),
    ['matinee'],
  );
  // Without a start nothing says two events are one performance.
  const undated = [event('a', { startsAt: null }), event('b', { startsAt: null })];
  assert.deepEqual(
    findSamePerformance(undated, undated[0]).map(({ _id }) => _id),
    ['a'],
  );
});

test('summarizeGateEvents names the events of a gate without repeating itself', () => {
  assert.deepEqual(
    summarizeGateEvents([
      event('adults', { category: 'Adults' }),
      event('reduced', { category: 'Reduced' }),
    ]),
    {
      titles: ['Hamlet'],
      startsAt: ['2026-10-01T18:00:00.000Z'],
      locations: ['Main stage'],
      categories: ['Adults', 'Reduced'],
    },
  );
  assert.deepEqual(
    summarizeGateEvents([
      event('a', { location: null }),
      event('b', { startsAt: '2026-10-01T20:00:00.000Z' }, { texts: { title: 'Faust' } }),
    ]),
    {
      titles: ['Hamlet', 'Faust'],
      startsAt: ['2026-10-01T18:00:00.000Z', '2026-10-01T20:00:00.000Z'],
      locations: ['Main stage'],
      categories: [],
    },
  );
});
