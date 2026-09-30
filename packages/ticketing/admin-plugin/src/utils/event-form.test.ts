import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getTicketEventFormValues, toUpdateTicketEventInput } from './event-form.ts';

test('the event editor starts from the stored event details', () => {
  const startsAt = new Date(2026, 8, 29, 20, 0);
  assert.deepEqual(
    getTicketEventFormValues({
      event: {
        startsAt: startsAt.toISOString(),
        location: 'Main hall',
        category: 'Parkett',
        durationMinutes: 90,
        doorsOpenMinutesBefore: 30,
      },
    }),
    {
      startsAt: '2026-09-29T20:00',
      location: 'Main hall',
      category: 'Parkett',
      durationMinutes: '90',
      doorsOpenMinutesBefore: '30',
    },
  );
  assert.deepEqual(getTicketEventFormValues({}), {
    startsAt: '',
    location: '',
    category: '',
    durationMinutes: '',
    doorsOpenMinutesBefore: '',
  });
});

test('the event editor sends every detail, blanks clear one', () => {
  assert.deepEqual(
    toUpdateTicketEventInput({
      startsAt: '2026-09-29T20:05',
      location: '  Main hall ',
      category: '',
      durationMinutes: '90',
      doorsOpenMinutesBefore: ' ',
    }),
    {
      input: {
        startsAt: new Date(2026, 8, 29, 20, 5).toISOString(),
        location: 'Main hall',
        category: null,
        durationMinutes: 90,
        doorsOpenMinutesBefore: null,
      },
    },
  );
  assert.deepEqual(
    toUpdateTicketEventInput({
      startsAt: 'someday',
      location: '',
      category: '',
      durationMinutes: '-5',
      doorsOpenMinutesBefore: '1.5',
    }),
    { errors: ['startsAt', 'durationMinutes', 'doorsOpenMinutesBefore'] },
  );
  assert.deepEqual(
    toUpdateTicketEventInput({
      startsAt: '',
      location: '',
      category: '',
      durationMinutes: 'abc',
      doorsOpenMinutesBefore: '0',
    }),
    { errors: ['durationMinutes'] },
  );
});
