import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

// The mutations return the production id only; the production and the lists are fetched again.
const CreateTicketProductionMutation = gql`
  mutation CreateTicketProduction($production: CreateTicketProductionInput!) {
    createTicketProduction(production: $production) {
      _id
      texts {
        _id
        slug
      }
    }
  }
`;

const UpdateTicketProductionMutation = gql`
  mutation UpdateTicketProduction($productionId: ID!, $production: UpdateTicketProductionInput!) {
    updateTicketProduction(productionId: $productionId, production: $production) {
      _id
    }
  }
`;

const PublishTicketProductionMutation = gql`
  mutation PublishTicketProduction($productionId: ID!) {
    publishTicketProduction(productionId: $productionId) {
      _id
      status
    }
  }
`;

const UnpublishTicketProductionMutation = gql`
  mutation UnpublishTicketProduction($productionId: ID!) {
    unpublishTicketProduction(productionId: $productionId) {
      _id
      status
    }
  }
`;

const SyncTicketProductionMutation = gql`
  mutation SyncTicketProduction($productionId: ID!) {
    syncTicketProduction(productionId: $productionId) {
      _id
    }
  }
`;

const RemoveTicketProductionMutation = gql`
  mutation RemoveTicketProduction($productionId: ID!) {
    removeTicketProduction(productionId: $productionId) {
      _id
      status
    }
  }
`;

const AddTicketPerformanceMutation = gql`
  mutation AddTicketPerformance($productionId: ID!, $performance: TicketPerformanceInput!) {
    addTicketPerformance(productionId: $productionId, performance: $performance) {
      _id
    }
  }
`;

const UpdateTicketPerformanceMutation = gql`
  mutation UpdateTicketPerformance(
    $productionId: ID!
    $startsAt: DateTimeISO!
    $performance: UpdateTicketPerformanceInput!
  ) {
    updateTicketPerformance(
      productionId: $productionId
      startsAt: $startsAt
      performance: $performance
    ) {
      _id
    }
  }
`;

const RemoveTicketPerformanceMutation = gql`
  mutation RemoveTicketPerformance($productionId: ID!, $startsAt: DateTimeISO!) {
    removeTicketPerformance(productionId: $productionId, startsAt: $startsAt) {
      _id
    }
  }
`;

const CancelTicketPerformanceMutation = gql`
  mutation CancelTicketPerformance(
    $productionId: ID!
    $startsAt: DateTimeISO!
    $generateDiscount: Boolean
  ) {
    cancelTicketPerformance(
      productionId: $productionId
      startsAt: $startsAt
      generateDiscount: $generateDiscount
    )
  }
`;

const AddTicketCategoryMutation = gql`
  mutation AddTicketCategory($productionId: ID!, $category: TicketCategoryInput!) {
    addTicketCategory(productionId: $productionId, category: $category) {
      _id
    }
  }
`;

const UpdateTicketCategoryMutation = gql`
  mutation UpdateTicketCategory(
    $productionId: ID!
    $code: String!
    $category: UpdateTicketCategoryInput!
    $applyToPerformances: Boolean
  ) {
    updateTicketCategory(
      productionId: $productionId
      code: $code
      category: $category
      applyToPerformances: $applyToPerformances
    ) {
      _id
    }
  }
`;

const RemoveTicketCategoryMutation = gql`
  mutation RemoveTicketCategory($productionId: ID!, $code: String!) {
    removeTicketCategory(productionId: $productionId, code: $code) {
      _id
    }
  }
`;

const refetchQueries = ['TicketProductionDetail', 'TicketProductions', 'TicketEvents'];

/** All changes of productions, their performances and categories. Needs manageProducts. */
const useTicketProductionMutations = () => {
  const options = { refetchQueries, awaitRefetchQueries: true };
  const [create] = useMutation<any>(CreateTicketProductionMutation, options);
  const [update] = useMutation<any>(UpdateTicketProductionMutation, options);
  const [publish] = useMutation<any>(PublishTicketProductionMutation, options);
  const [unpublish] = useMutation<any>(UnpublishTicketProductionMutation, options);
  const [sync] = useMutation<any>(SyncTicketProductionMutation, options);
  const [remove] = useMutation<any>(RemoveTicketProductionMutation, {
    refetchQueries: ['TicketProductions', 'TicketEvents'],
  });
  const [addPerformance] = useMutation<any>(AddTicketPerformanceMutation, options);
  const [updatePerformance] = useMutation<any>(UpdateTicketPerformanceMutation, options);
  const [removePerformance] = useMutation<any>(RemoveTicketPerformanceMutation, options);
  const [cancelPerformance] = useMutation<any>(CancelTicketPerformanceMutation, options);
  const [addCategory] = useMutation<any>(AddTicketCategoryMutation, options);
  const [updateCategory] = useMutation<any>(UpdateTicketCategoryMutation, options);
  const [removeCategory] = useMutation<any>(RemoveTicketCategoryMutation, options);

  return {
    createTicketProduction: async (production) =>
      (await create({ variables: { production } })).data?.createTicketProduction,
    updateTicketProduction: (productionId: string, production) =>
      update({ variables: { productionId, production } }),
    publishTicketProduction: (productionId: string) => publish({ variables: { productionId } }),
    unpublishTicketProduction: (productionId: string) => unpublish({ variables: { productionId } }),
    syncTicketProduction: (productionId: string) => sync({ variables: { productionId } }),
    removeTicketProduction: (productionId: string) => remove({ variables: { productionId } }),
    addTicketPerformance: (productionId: string, performance) =>
      addPerformance({ variables: { productionId, performance } }),
    updateTicketPerformance: (productionId: string, startsAt: string, performance) =>
      updatePerformance({ variables: { productionId, startsAt, performance } }),
    removeTicketPerformance: (productionId: string, startsAt: string) =>
      removePerformance({ variables: { productionId, startsAt } }),
    cancelTicketPerformance: async (productionId: string, startsAt: string, generateDiscount = false) =>
      (await cancelPerformance({ variables: { productionId, startsAt, generateDiscount } })).data
        ?.cancelTicketPerformance,
    addTicketCategory: (productionId: string, category) =>
      addCategory({ variables: { productionId, category } }),
    updateTicketCategory: (productionId: string, code: string, category, applyToPerformances = false) =>
      updateCategory({ variables: { productionId, code, category, applyToPerformances } }),
    removeTicketCategory: (productionId: string, code: string) =>
      removeCategory({ variables: { productionId, code } }),
  };
};

export default useTicketProductionMutations;
