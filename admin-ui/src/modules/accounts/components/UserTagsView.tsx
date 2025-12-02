import useSetUserTags from '../hooks/useSetUserTags';
import { IRoleAction } from '../../../gql/types';

import TagList from '../../common/components/TagList';
import useAuth from '../../Auth/useAuth';
import useApp from '../../common/hooks/useApp';

const UserTagsView = ({ tags: defaultTags = [], userId }) => {
  const { hasRole } = useAuth();
  const { setUserTags } = useSetUserTags();
  const { shopInfo } = useApp();
  const updateUserTags = async ({ tags }) => {
    await setUserTags({ tags, userId });
  };
  return (
    <TagList
      defaultValue={defaultTags}
      onSubmit={updateUserTags}
      enableEdit={hasRole(IRoleAction.ManageUsers)}
      availableTagOptions={
        shopInfo?.adminUiConfig?.userTags
          ?.filter((t) => !(defaultTags || [])?.includes(t))
          ?.map((tag) => ({
            label: tag,
            value: tag,
          })) || []
      }
    />
  );
};

export default UserTagsView;
