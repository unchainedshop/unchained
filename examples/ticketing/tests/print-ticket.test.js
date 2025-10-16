import test from 'node:test';
import assert from 'node:assert';


const {UNCHAINED_PDF_PRINT_HANDLER_PATH} = process.env

test.describe('printTicketsHandler', async () => {    
  test('Return PDF stream when valid parameters are provided', async () => {    
    const result = await fetch(`http://localhost:4010${UNCHAINED_PDF_PRINT_HANDLER_PATH}/?orderId=SimpleOrder._id&otp=4444`, {
       headers: {
        'x-magic-key': '84c6c63f1bfc5390740bb16e2ee6f8c66d322a148736aad31b6923fa69c766ed' 
        
       }
    });    
    assert.strictEqual(result.status, 200);
    const contentType = result.headers.get('content-type');
    assert.match(contentType, /application\/pdf/);        
    assert.strictEqual(result.headers.get('content-type'), 'application/pdf');
  });

  test('Return PDF_GENERATION_ERROR Error when missing otp parameter', async () => {    
    const result = await fetch(`http://localhost:4010${UNCHAINED_PDF_PRINT_HANDLER_PATH}/?orderId=SimpleOrder._id`, {
       headers: {
        'x-magic-key': '84c6c63f1bfc5390740bb16e2ee6f8c66d322a148736aad31b6923fa69c766ed'         
       }
    });  
    assert.strictEqual(result.status, 403);
    const error = await result.json()
    
    assert.strictEqual(error.success, false);
    assert.strictEqual(error.message, 'Error generating PDF');
    assert.strictEqual(error.name, 'PDF_GENERATION_ERROR');   
  });

  test('Return PDF_GENERATION_ERROR Error when missing orderId parameter', async () => {    
    const result = await fetch(`http://localhost:4010${UNCHAINED_PDF_PRINT_HANDLER_PATH}/?otp=otp123`, {
       headers: {
        'x-magic-key': '84c6c63f1bfc5390740bb16e2ee6f8c66d322a148736aad31b6923fa69c766ed'         
       }
    });  
    assert.strictEqual(result.status, 403);
    const error = await result.json()
    
    assert.strictEqual(error.success, false);
    assert.strictEqual(error.message, 'Error generating PDF');
    assert.strictEqual(error.name, 'PDF_GENERATION_ERROR');   
  });

  test('Return PDF stream when invalid orderId is provided', async () => {    
    const result = await fetch(`http://localhost:4010${UNCHAINED_PDF_PRINT_HANDLER_PATH}/?orderId=1234fdg&otp=4444`, {
       headers: {
        'x-magic-key': '84c6c63f1bfc5390740bb16e2ee6f8c66d322a148736aad31b6923fa69c766ed' 
        
       }
    });    
    
    
    
    assert.strictEqual(result.status, 200);
    const contentType = result.headers.get('content-type');
    assert.match(contentType, /application\/pdf/);        
    assert.strictEqual(result.headers.get('content-type'), 'application/pdf'); 
  });

});
