import { z } from 'zod';
import { Context } from '../../context.js';
import { getNormalizedProductDetails } from '../utils/getNormalizedProductDetails.js';
import { ProductWrongTypeError } from '../../errors.js';
import { ProductTypes } from '@unchainedshop/core-products';

const ProductAssignmentVectorSchema = z.object({
    key: z.string().min(1).describe('Attribute key (e.g., "Color", "Size")'),
    value: z.string().min(1).describe('Attribute value (e.g., "Red", "M")'),
});

export const RemoveProductAssignmentSchema = {
    proxyId: z.string().min(1).describe('ID of the configurable_product'),
    vectors: z
        .array(ProductAssignmentVectorSchema)
        .min(1)
        .describe('Combination of attributes uniquely identifying the variant'),
};
export const RemoveProductAssignmentZodSchema = z.object(RemoveProductAssignmentSchema);
export type RemoveProductAssignmentParams = z.infer<typeof RemoveProductAssignmentZodSchema>;

export async function removeProductAssignmentHandler(
    context: Context,
    params: RemoveProductAssignmentParams,
) {
    const { proxyId, vectors } = params;
    const { modules } = context;

    try {
        const product = await modules.products.findProduct({ productId: proxyId });

        if (product.type !== ProductTypes.ConfigurableProduct)
            throw new ProductWrongTypeError({
                productId: proxyId,
                received: product.type,
                required: ProductTypes.ConfigurableProduct,
            });

        await modules.products.assignments.removeAssignment(proxyId, { vectors: vectors as any });

        return {
            content: [
                {
                    type: 'text' as const,
                    text: JSON.stringify({
                        product: await getNormalizedProductDetails(proxyId, context),
                    }),
                },
            ],
        };
    } catch (error) {
        return {
            content: [
                {
                    type: 'text' as const,
                    text: `Error removing product assignment: ${(error as Error).message}`,
                },
            ],
        };
    }
}
