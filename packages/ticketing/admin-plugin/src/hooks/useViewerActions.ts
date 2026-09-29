import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

const ViewerActionsQuery = gql`
  query TicketingViewerActions {
    me {
      _id
      roles
      allowedActions
    }
  }
`;

// Mirrors the backend rule set: administrators hold every action, everybody else
// only what User.allowedActions advertises.
const useViewerActions = () => {
  const { data, loading } = useQuery(ViewerActionsQuery);
  const viewer = (data as any)?.me;
  const hasAction = (action: string) =>
    Boolean(viewer?.roles?.includes('admin') || viewer?.allowedActions?.includes(action));
  return { hasAction, loading };
};

export default useViewerActions;
