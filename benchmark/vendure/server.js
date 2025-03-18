// Simple HTTP server that logs all requests and responds with JSON
const http = require('http');

const server = http.createServer((req, res) => {
  console.log(`Received request: ${req.method} ${req.url}`);
  
  // Set CORS headers to allow requests from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS requests for CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Handle GraphQL API endpoint
  if (req.url === '/shop-api') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const query = JSON.parse(body);
        
        if (query.query && query.query.includes('products')) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            data: {
              products: {
                items: Array.from({ length: 20 }, (_, i) => ({
                  id: `product-${i + 1}`,
                  name: `Product ${i + 1}`,
                  description: `Description for product ${i + 1}`,
                  variants: [
                    {
                      id: `variant-${i + 1}`,
                      name: `Variant ${i + 1}`,
                      price: 1000 + i * 100,
                      currencyCode: 'USD'
                    }
                  ],
                  facetValues: [
                    {
                      id: `color-${i % 5 + 1}`,
                      name: ['red', 'blue', 'green', 'yellow', 'black'][i % 5],
                      facet: { name: 'color' }
                    },
                    {
                      id: `size-${i % 10 + 1}`,
                      name: String(i % 10 + 1),
                      facet: { name: 'size' }
                    }
                  ]
                })),
                totalItems: 20
              }
            }
          }));
        } else if (query.query && query.query.includes('collections')) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            data: {
              collections: {
                items: Array.from({ length: 5 }, (_, i) => ({
                  id: `category-${i + 1}`,
                  name: `Category ${i + 1}`,
                  children: Array.from({ length: 3 }, (_, j) => ({
                    id: `subcategory-${i + 1}-${j + 1}`,
                    name: `Subcategory ${i + 1}-${j + 1}`
                  }))
                })),
                totalItems: 5
              }
            }
          }));
        } else if (query.query && query.query.includes('addItemToOrder')) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            data: {
              addItemToOrder: {
                code: 'ORDER-1',
                state: 'AddingItems',
                total: 1000
              },
              setOrderShippingAddress: {
                code: 'ORDER-1'
              },
              setOrderBillingAddress: {
                code: 'ORDER-1'
              },
              setOrderCustomerDetails: {
                code: 'ORDER-1'
              },
              transitionOrderToState: {
                code: 'ORDER-1',
                state: 'ArrangingPayment'
              },
              addPaymentToOrder: {
                code: 'ORDER-1',
                state: 'PaymentSettled',
                total: 1000
              }
            }
          }));
          
          // Also emit email notification for orders
          if (body && body.includes('emailAddress')) {
            console.log('Order completed, email notification would be sent');
          }
        } else {
          // Default GraphQL response
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            data: {
              __schema: {
                types: [
                  { name: 'Query' },
                  { name: 'Mutation' },
                  { name: 'Product' },
                  { name: 'Collection' },
                  { name: 'Order' }
                ]
              }
            }
          }));
        }
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ errors: [{ message: 'Invalid GraphQL request' }] }));
      }
    });
  } else {
    // Default response for other routes
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'Vendure mock server is running',
      endpoint: req.url,
      method: req.method
    }));
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Vendure mock server running on port ${PORT}`);
  console.log(`Ready to accept connections`);
}); 