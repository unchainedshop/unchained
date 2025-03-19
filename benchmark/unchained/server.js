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

  // Handle GraphQL API endpoint (Unchained uses GraphQL)
  if (req.url === "/graphql") {
    // Check if it's a product query
    let body = "";
    req.on("data", chunk => {
      body += chunk.toString();
    });
    
    req.on("end", () => {
      try {
        const query = JSON.parse(body);
        
        if (query.query && query.query.includes("products")) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({
            data: {
              products: {
                items: Array.from({ length: 20 }, (_, i) => ({
                  _id: `product-${i + 1}`,
                  texts: {
                    title: `Product ${i + 1}`,
                    description: `Description for product ${i + 1}`
                  },
                  status: "ACTIVE",
                  tags: [`tag-${i % 5 + 1}`],
                  pricing: {
                    price: {
                      amount: 1000 + i * 100,
                      currency: "USD"
                    }
                  },
                  media: [
                    {
                      _id: `media-${i + 1}`,
                      file: {
                        url: `https://example.com/images/product-${i + 1}.jpg`
                      }
                    }
                  ],
                  variations: [
                    {
                      _id: `variation-${i + 1}`,
                      texts: {
                        title: `Variant ${i + 1}`
                      },
                      pricing: {
                        price: {
                          amount: 1000 + i * 100,
                          currency: "USD"
                        }
                      }
                    }
                  ],
                  color: ["red", "blue", "green", "yellow", "black"][i % 5],
                  size: (i % 10) + 1
                })),
                count: 20
              }
            }
          }));
        } else if (query.query && query.query.includes("categories")) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({
            data: {
              categories: {
                items: Array.from({ length: 5 }, (_, i) => ({
                  _id: `category-${i + 1}`,
                  texts: {
                    title: `Category ${i + 1}`,
                    subtitle: `Subtitle for category ${i + 1}`
                  },
                  children: Array.from({ length: 3 }, (_, j) => ({
                    _id: `subcategory-${i + 1}-${j + 1}`,
                    texts: {
                      title: `Subcategory ${i + 1}-${j + 1}`,
                      subtitle: `Subtitle for subcategory ${i + 1}-${j + 1}`
                    }
                  }))
                })),
                count: 5
              }
            }
          }));
        } else if (query.query && query.query.includes("createCart")) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({
            data: {
              createCart: {
                _id: "cart-1",
                items: [
                  {
                    _id: "item-1",
                    product: {
                      _id: "product-1",
                      texts: {
                        title: "Product 1"
                      }
                    },
                    quantity: 1,
                    pricing: {
                      price: {
                        amount: 1000,
                        currency: "USD"
                      }
                    }
                  }
                ],
                user: null,
                contact: {
                  emailAddress: "test@example.com"
                },
                address: {
                  firstName: "Test",
                  lastName: "User",
                  addressLine: "123 Test St",
                  city: "Test City",
                  postalCode: "12345",
                  countryCode: "US"
                },
                total: {
                  amount: 1000,
                  currency: "USD"
                }
              }
            }
          }));
          
          // Also emit email notification for orders
          if (body && body.includes("emailAddress")) {
            console.log("Order completed, email notification would be sent");
          }
        } else {
          // Default GraphQL response
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({
            data: {
              __schema: {
                types: [
                  { name: "Query" },
                  { name: "Mutation" },
                  { name: "Product" },
                  { name: "Category" },
                  { name: "Cart" },
                  { name: "Order" }
                ]
              }
            }
          }));
        }
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ errors: [{ message: "Invalid GraphQL request" }] }));
      }
    });
  } else {
    // Default response for other routes
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      message: "Unchained mock server is running",
      endpoint: req.url,
      method: req.method
    }));
  }
});

const PORT = process.env.PORT || 3003;
server.listen(PORT, () => {
  console.log(`Unchained mock server running on port ${PORT}`);
  console.log(`Ready to accept connections`);
}); 