import test from 'node:test';
import assert from 'node:assert';
import { disconnect, getServerPort, setupDatabase } from './helpers.js';
import { Orders } from './seeds/orders.js';
import { ADMIN_TOKEN } from './seeds/users.js';
  test.describe('printTicketsHandler', async () => {
    test.before(async () => {
    await setupDatabase();    
  });

  test.after(async () => {
    await disconnect();
  });
  test('Return SVG stream when valid parameters are provided', async () => {
    const result = await fetch(
      `http://localhost:${getServerPort()}/rest/print_tickets/?orderId=${Orders[0]._id}&otp=4444`,
      {
        headers: {
          'x-magic-key': 'e9070055441ea4c223b4ca9286600c3692ff01b6d812a5a555a4a14ef42e5994',
          sessionCookie: ADMIN_TOKEN,
        },
      },
    );    
    assert.strictEqual(result.status, 200);
    const contentType = result.headers.get('content-type');
    assert.strictEqual(contentType, 'image/svg+xml');
  });

    test('Throws error when invalid magic key is provided', async () => {
    const result = await fetch(
      `http://localhost:${getServerPort()}/rest/print_tickets/?orderId=${Orders[0]._id}&otp=4444`,
      {
        headers: {
          'x-magic-key': 'invalid-magic-key',
          sessionCookie: ADMIN_TOKEN,
        },
      },
    );    
    assert.strictEqual(result.status, 403);  
  });           
  

  test('Return PDF_GENERATION_ERROR Error when missing otp parameter', async () => {
    const result = await fetch(`http://localhost:${getServerPort()}/rest/print_tickets/?orderId=${Orders[0]._id}`, {
      headers: {
        'x-magic-key': 'e9070055441ea4c223b4ca9286600c3692ff01b6d812a5a555a4a14ef42e5994',
          sessionCookie: ADMIN_TOKEN,
      },
    });
    assert.strictEqual(result.status, 403);
    const error = await result.json();

    assert.strictEqual(error.success, false);
    assert.strictEqual(error.message, 'Error generating PDF');
    assert.strictEqual(error.name, 'PDF_GENERATION_ERROR');
  });

  test('Return PDF_GENERATION_ERROR Error when missing orderId parameter', async () => {
    const result = await fetch(`http://localhost:${getServerPort()}/rest/print_tickets/?otp=otp123`, {
      headers: {
        'x-magic-key': 'e9070055441ea4c223b4ca9286600c3692ff01b6d812a5a555a4a14ef42e5994',
          sessionCookie: ADMIN_TOKEN,
      },
    });
    assert.strictEqual(result.status, 403);
    const error = await result.json();

    assert.strictEqual(error.success, false);
    assert.strictEqual(error.message, 'Error generating PDF');
    assert.strictEqual(error.name, 'PDF_GENERATION_ERROR');
  });

  test('Return PDF stream when invalid orderId is provided', async () => {
    const result = await fetch(`http://localhost:${getServerPort()}/rest/print_tickets/?orderId=1234fdg&otp=4444`, {
      headers: {
        'x-magic-key': 'e9070055441ea4c223b4ca9286600c3692ff01b6d812a5a555a4a14ef42e5994',
          sessionCookie: ADMIN_TOKEN,
      },
    });
  
    assert.strictEqual(result.status, 403);
  
  });

});
