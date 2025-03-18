const http = require("http");

const server = http.createServer((req, res) => {
  console.log(`Received request: ${req.method} ${req.url}`);
  
  // Set CORS headers to allow requests from any origin
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  // Handle OPTIONS requests for CORS
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Handle different endpoints
  if (req.url.startsWith("/store/products")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      products: Array.from({ length: 20 }, (_, i) => ({
        id: `product-${i + 1}`,
        title: `Product ${i + 1}`,
        description: `Description for product ${i + 1}`,
        variants: [
          {
            id: `variant-${i + 1}`,
            title: `Variant ${i + 1}`,
            prices: [
              {
                currency_code: "usd",
                amount: 1000 + i * 100
              },
              {
                currency_code: "chf",
                amount: 900 + i * 90
              }
            ]
          }
        ],
        metadata: {
          color: ["red", "blue", "green", "yellow", "black"][i % 5],
          size: (i % 10) + 1
        }
      })),
      count: 20,
      offset: 0,
      limit: 20
    }));
  } else if (req.url.startsWith("/store/product-categories")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      product_categories: Array.from({ length: 5 }, (_, i) => ({
        id: `category-${i + 1}`,
        name: `Category ${i + 1}`,
        children: Array.from({ length: 3 }, (_, j) => ({
          id: `subcategory-${i + 1}-${j + 1}`,
          name: `Subcategory ${i + 1}-${j + 1}`
        }))
      })),
      count: 5,
      offset: 0,
      limit: 5
    }));
  } else if (req.url.startsWith("/store/carts")) {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    
    req.on("end", () => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        cart: {
          id: "cart-1",
          items: [
            {
              id: "item-1",
              title: "Product 1",
              quantity: 1,
              unit_price: 1000,
              variant: {
                id: "variant-1",
                title: "Variant 1"
              }
            }
          ],
          region: {
            id: "region-1",
            name: "United States",
            currency_code: "usd"
          },
          email: "test@example.com",
          shipping_address: {
            first_name: "Test",
            last_name: "User",
            address_1: "123 Test St",
            city: "Test City",
            postal_code: "12345",
            country_code: "us"
          },
          billing_address: {
            first_name: "Test",
            last_name: "User",
            address_1: "123 Test St",
            city: "Test City",
            postal_code: "12345",
            country_code: "us"
          },
          total: 1000
        }
      }));
      
      // Also emit email notification for orders
      if (data && data.includes("email")) {
        console.log("Order completed, email notification would be sent");
      }
    });
  } else {
    // Default response for other routes
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      message: "Medusa mock server is running",
      endpoint: req.url,
      method: req.method
    }));
  }
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`Medusa mock server running on port ${PORT}`);
  console.log(`Ready to accept connections`);
}); 