---
sidebar_position: 5
title: Create Your First Product
sidebar_label: First Product & Sale
---

# Create Your First Product and Make a Sale

This guide walks you through creating your first product, setting up categories, and completing a test purchase through your storefront.

## Step 1: Create a Product Category (Assortment)

Categories help organize your products and create navigation in your storefront.

### Create Root Category

1. **Navigate to Assortments**
   - In Admin UI, click **Assortments** in the sidebar

2. **Create New Assortment**
   - Click **Add assortment**
   - Fill in:
     - **ID**: `main-catalog`
     - **Title**: `Main Catalog`
     - **Slug**: `catalog` (for URL: /shop/catalog)
   - Click **Create**

3. **Configure the Assortment**
   - Toggle **Active** to enable it
   - Add a description in the **Texts** tab
   - Upload a cover image in the **Media** tab

### Create Subcategories (Optional)

1. **Add Child Categories**
   - Click **Add assortment** again
   - Create categories like:
     - `electronics` - Electronics
     - `clothing` - Clothing
     - `books` - Books

2. **Link Categories**
   - Go to parent category
   - Click **Links** tab
   - Add child categories

## Step 2: Create Your First Product

### Create a Simple Product

1. **Navigate to Products**
   - Click **Products** in the sidebar
   - Click **Add product**

2. **Fill Product Details**
   ```
   Type: Simple Product
   ID: my-first-product
   Title: Awesome T-Shirt
   ```
   - Click **Create**

3. **Add Product Information**

   **Texts Tab:**
   - **Title**: Awesome T-Shirt
   - **Slug**: awesome-t-shirt (URL: /shop/products/awesome-t-shirt)
   - **Subtitle**: Comfortable cotton t-shirt
   - **Description**: Write a compelling product description

   **Media Tab:**
   - Click **Add Media**
   - Upload product images
   - Set primary image by reordering

   **Commerce Tab:**
   - **Price**: 29.99
   - **Currency**: USD (or your default)
   - **Tax Class**: Standard (if applicable)

   **Supply Tab:**
   - **SKU**: TSH-001
   - **Initial Stock**: 100

### Assign to Category

1. **Go to Assortments**
   - Navigate to your category
   - Click **Products** tab
   - Click **Add product**
   - Search and select your product
   - Click **Add**

### Publish the Product

1. **Important**: Products are created as drafts
2. Click **Publish** button to make it live
3. Status should change from "Draft" to "Active"

![Product Publishing](../assets/publish-draft-product.png)

## Step 3: View in Storefront

1. **Open your storefront**
   - Go to http://localhost:3000

2. **Navigate to your product**
   - Click on catalog/categories
   - Find your product
   - Or go directly to: `/shop/products/awesome-t-shirt`

3. **Verify product details**
   - Images are displayed
   - Price is correct
   - Add to cart button works

## Step 4: Complete a Test Purchase

### Create Customer Account

1. **Sign up as customer**
   - Click "Sign Up" in storefront
   - Create account with:
     - Email: customer@test.com
     - Password: testpassword

2. **Verify email** (in development, check console logs)

### Add to Cart and Checkout

1. **Add product to cart**
   - Go to product page
   - Click "Add to Cart"
   - View cart to verify

2. **Proceed to checkout**
   - Click "Checkout" in cart
   - Enter shipping information:
     ```
     Name: Test Customer
     Address: 123 Test Street
     City: Test City
     Postal Code: 12345
     Country: Your Country
     ```

3. **Select delivery method**
   - Choose configured delivery provider

4. **Select payment method**
   - Choose "Invoice" for testing

5. **Place order**
   - Review order details
   - Click "Place Order"
   - Note the order number

## Step 5: Process the Order (Admin)

1. **View order in Admin UI**
   - Go to **Orders** section
   - Find your test order
   - Click to view details

2. **Process payment**
   - Click **Mark as Paid** (for invoice payment)
   - Order status changes to "Confirmed"

3. **Fulfill order**
   - Click **Mark as Delivered**
   - Order status changes to "Fulfilled"

4. **Customer receives confirmation**
   - Check email (or console logs in dev)

## Creating Different Product Types

### Configurable Product (with Variations)

1. **Create base product**
   - Type: **Configurable Product**
   - ID: `tshirt-configurable`

2. **Add variations**
   - Go to **Variations** tab
   - Add variation type: "Size"
   - Add options: S, M, L, XL

3. **Create variation assignments**
   - For each size, create assignment
   - Set specific prices or stock levels

### Bundle Product

1. **Create bundle**
   - Type: **Bundle Product**
   - ID: `starter-pack`

2. **Add bundle items**
   - Go to **Bundle Items** tab
   - Add multiple products
   - Set quantities

### Digital Product

1. **Create digital product**
   - Type: **Simple Product**
   - Enable **Digital Delivery**

2. **Configure delivery**
   - Use email delivery provider
   - Upload digital file

## Tips for Product Management

### SEO Optimization
- Use descriptive slugs
- Write unique meta descriptions
- Add alt text to images

### Pricing Strategies
- Set compare prices for sales
- Use price levels for B2B
- Configure tax-inclusive pricing

### Inventory Management
- Set low stock thresholds
- Enable backorders if needed
- Track stock movements

### Product Organization
- Use consistent naming
- Create logical category structure
- Tag products appropriately

## Advanced Product Features

### Product Reviews
Enable customer reviews:
```javascript
// In storefront product page
const { addProductReview } = useProductReviews();
```

### Related Products
Link complementary products:
1. Go to product
2. Add in **Assignments** tab
3. Set relationship type

### Product Variants
For complex products:
- Color variations
- Size variations
- Material options
- Custom configurations

## Troubleshooting

### Product Not Showing
- Ensure product is published
- Check category assignment
- Verify storefront connection

### Price Not Displaying
- Confirm price is set
- Check currency configuration
- Verify tax settings

### Images Not Loading
- Check file formats (JPG, PNG)
- Verify upload permissions
- Clear browser cache

### Cart Issues
- Check browser console
- Verify API connection
- Test in incognito mode

## Next Steps

Congratulations! You've successfully:
- ✅ Set up Unchained Engine
- ✅ Configured Admin UI
- ✅ Created your first product
- ✅ Completed a test purchase

### What's Next?

1. **Expand Your Catalog**
   - Add more products
   - Create detailed categories
   - Set up filters for navigation

2. **Customize Your Storefront**
   - Modify theme and styling
   - Add custom pages
   - Implement search

3. **Configure Advanced Features**
   - Set up real payment providers
   - Configure shipping rates
   - Enable multi-language support

4. **Prepare for Production**
   - Set up monitoring
   - Configure backups
   - Implement security measures

## Additional Resources

- [Full Documentation](/docs)
- [API Reference](/docs/api)
- [Plugin Development](/docs/plugins)
- [Deployment Guide](/docs/deployment)

## Getting Help

If you encounter issues:
1. Check the [troubleshooting guide](/docs/troubleshooting)
2. Search [GitHub Issues](https://github.com/unchainedshop/unchained/issues)
3. Join our [Discord community](https://discord.gg/unchained)
4. Contact [support@unchained.shop](mailto:support@unchained.shop)