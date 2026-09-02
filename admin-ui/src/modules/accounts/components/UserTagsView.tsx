import useSetUserTags from '../hooks/useSetUserTags';

import TagList from '@/components/ui/Tag/TagList';
import useApp from '../../common/hooks/useApp';

const UserTagsView = ({ tags: defaultTags = [], userId, canEdit = false }) => {
  const { setUserTags } = useSetUserTags();
  const { shopInfo } = useApp();
  const updateUserTags = async ({ tags }) => {
    await setUserTags({ tags, userId });
  };
  return (
    <TagList
      defaultValue={defaultTags}
      onSubmit={updateUserTags}
      enableEdit={canEdit}
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
