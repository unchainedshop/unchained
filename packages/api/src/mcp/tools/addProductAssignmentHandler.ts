import { z } from 'zod';
import { Context } from '../../context.js';
import { getNormalizedProductDetails } from '../utils/getNormalizedProductDetails.js';
import {
    ProductNotFoundError,
    ProductVariationVectorAlreadySet,
    ProductVariationVectorInvalid,
    ProductWrongTypeError,
} from '../../errors.js';
import { ProductConfiguration, ProductTypes } from '@unchainedshop/core-products';

const extractVariationMatrix = (variations = []) => {
    const cartesianProduct = (arrays) => {
        return arrays.reduce(
            (acc, array) => acc.flatMap((item) => array.map((value) => [...item, value])),
            [[]],
        );
    };
    const keys = variations.map((item) => item.key);
    const options = variations.map((item) => item.options);
    const combinations = cartesianProduct(options);
    return combinations.map((combination) =>
        combination.reduce((acc, value, index) => {
            acc[keys[index]] = value;
            return acc;
        }, {}),
    );
};

const combinationExists = (matrix, combination) => {
    return matrix.some((variation) => {
        return (
            Object.keys(variation).length === Object.keys(combination).length && // Ensure both have the same number of keys
            Object.entries(combination).every(([key, value]) => variation[key] === value)
        );
    });
};

// Zod schema for ProductAssignmentVectorInput
const ProductAssignmentVectorSchema = z.object({
    key: z.string().min(1).describe('Attribute key (e.g., "Color", "Size")'),
    value: z.string().min(1).describe('Attribute value (e.g., "Red", "M")'),
});

export const AssignProductVariationSchema = {
    proxyId: z.string().min(1).describe('should be ID of the CONFIGURABLE_PRODUCT (parent) only'),
    productId: z
        .string()
        .min(1)
        .describe('ID of the product being assigned. can not be a CONFIGURABLE_PRODUCT product'),
    vectors: z
        .array(ProductAssignmentVectorSchema)
        .min(1)
        .describe('Combination of attributes uniquely identifying the variant'),
};
// Full schema for the mutation
export const AddProductAssignmentZodSchema = z.object(AssignProductVariationSchema);

export type AddProductAssignmentParams = z.infer<typeof AddProductAssignmentZodSchema>;

export async function addProductAssignmentHandler(context: Context, params: AddProductAssignmentParams) {
    const { proxyId, productId, vectors } = params;
    const { modules } = context;

    try {
        const proxyProduct = await modules.products.findProduct({
            productId: proxyId,
        });
        if (!proxyProduct) throw new ProductNotFoundError({ proxyId });

        if (proxyProduct.type !== ProductTypes.ConfigurableProduct)
            throw new ProductWrongTypeError({
                proxyId,
                received: proxyProduct.type,
                required: ProductTypes.ConfigurableProduct,
            });
        const variations = await modules.products.variations.findProductVariations({
            productId: proxyId,
        });
        const variationMatrix = extractVariationMatrix(variations);
        const normalizedVectors = vectors?.reduce((prev, { key, value }) => {
            return {
                ...prev,
                [key]: value,
            };
        }, {});
        if (!combinationExists(variationMatrix, normalizedVectors))
            throw new ProductVariationVectorInvalid({ proxyId, vectors });

        const added = await modules.products.assignments.addProxyAssignment({
            productId,
            proxyId,
            vectors: vectors as ProductConfiguration[],
        });

        if (!added) throw new ProductVariationVectorAlreadySet({ proxyId, vectors });

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
                    text: `Error assigning product: ${(error as Error).message}`,
                },
            ],
        };
    }
}
