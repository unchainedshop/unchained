import { z } from 'zod';
import { Context } from '../../../context.js';
import { Product, ProductText, ProductTypes } from '@unchainedshop/core-products';
import { log } from '@unchainedshop/logger';
const productTypeKeys = Object.keys(ProductTypes) as [
  keyof typeof ProductTypes,
  ...(keyof typeof ProductTypes)[],
];

export const CreateProductSchema = {
  product: z.object({
    type: z.enum(productTypeKeys).describe('Product type (e.g., "SIMPLE_PRODUCT")'),
    tags: z.array(z.string().min(1).toLowerCase()).optional().describe('Tags (lowercased strings)'),
  }),
  texts: z
    .array(
      z.object({
        locale: z
          .string()
          .min(2)
          .describe(
            'locale iso code like "en-US", "de-CH" use default defaultLanguageIsoCode in shop info if not explicitly provided. if language is explicitly provided check if it exists',
          ),
        slug: z.string().optional().describe('URL slug'),
        title: z.string().optional().describe('Product title'),
        subtitle: z.string().optional().describe('Product subtitle'),
        description: z.string().optional().describe('Markdown description'),
        vendor: z.string().optional().describe('Vendor name'),
        brand: z.string().optional().describe('Brand name'),
        labels: z.array(z.string()).optional().describe('Labels or tags'),
      }),
    )
    .nonempty()
    .describe('Localized product text entries'),
};

export const CreateProductZodSchema = z.object(CreateProductSchema);

export type CreateProductParams = z.infer<typeof CreateProductZodSchema>;

export async function createProductHandler(context: Context, params: CreateProductParams) {
  const { product, texts } = params;
  const { modules, userId } = context;

  try {
    log('handler createProductHandler', { userId, params });
    const newProduct = await modules.products.create(product as Product);
    let productTexts: any[] = texts;
    if (texts) {
      productTexts = await modules.products.texts.updateTexts(
        newProduct._id,
        texts as unknown as ProductText[],
      );
    }
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            product: {
              ...newProduct,
              texts: productTexts,
            },
          }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error creating product: ${(error as Error).message}`,
        },
      ],
    };
  }
}
