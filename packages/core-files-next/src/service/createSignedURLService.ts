import { CreateSignedURLService } from '@unchainedshop/types/files';
import { getFileAdapter } from '../utils/getFileAdapter';
import { getFileFromFileData } from '../utils/getFileFromFileData';

export const createSignedURLService: CreateSignedURLService = async (
  { directoryName, fileName, meta, userId },
  unchainedContext,
) => {
  const {
    modules: { files },
  } = unchainedContext;
  const fileUploadAdapter = getFileAdapter();
  const preparedFileData = await fileUploadAdapter.createSignedURL(
    directoryName,
    fileName,
    unchainedContext,
  );
  const fileData = getFileFromFileData(preparedFileData, meta);
  const fileId = await files.create(fileData, userId);

  const file = files.findFile({ fileId });
  return {
    ...file,
    putURL: preparedFileData.putURL,
  };
};

/*

curl -X PUT -T /Users/pozylon/Desktop/Bildschirmfoto\ 2022-02-17\ um\ 16.47.22.png  http://localhost:4010/gridfs/3e0cd78ac07f0028890ce36c391057dd0c5fb46f4c147fb73e54bd8a7ffee389/user-avatars/avatar.png?e=1645883865878&s=e7466b30039593e5790e23cab92878e0144289c3710344a55b78c9a916e2f78c

*/