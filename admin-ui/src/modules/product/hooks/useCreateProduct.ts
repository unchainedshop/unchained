import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  ICreateProductMutation,
  ICreateProductMutationVariables,
} from '../../../gql/types';
import ProductDetailFragment from '../fragments/ProductDetailFragment';
import ProductTextsFragment from '../fragments/ProductTextsFragment';

const CreateProductMutation = gql`
  mutation CreateProduct(
    $product: CreateProductInput!
    $texts: [ProductTextInput!]
  ) {
    createProduct(product: $product, texts: $texts) {
      ...ProductDetailFragment
      ... on SimpleProduct {
        texts {
          ...ProductTextsFragment
        }
      }
      ... on ConfigurableProduct {
        texts {
          ...ProductTextsFragment
        }
      }
      ... on BundleProduct {
        texts {
          ...ProductTextsFragment
        }
      }
      ... on TokenizedProduct {
        texts {
          ...ProductTextsFragment
        }
      }
      ... on PlanProduct {
        texts {
          ...ProductTextsFragment
        }
      }
    }
  }
  ${ProductDetailFragment}
  ${ProductTextsFragment}
`;

const useCreateProduct = () => {
  const [createProductMutation, { data, error, loading }] = useMutation<
    ICreateProductMutation,
    ICreateProductMutationVariables
  >(CreateProductMutation);

  const createProduct = async ({
    product: { type, tags },
    texts,
  }: ICreateProductMutationVariables) => {
    return createProductMutation({
      variables: { product: { type, tags }, texts },
      refetchQueries: ['Products', 'ShopStatus', 'ShopInfo'],
    });
  };
  const newProduct = data?.createProduct;
  return {
    createProduct,
    newProduct,
    error,
    loading,
  };
};

export default useCreateProduct;
