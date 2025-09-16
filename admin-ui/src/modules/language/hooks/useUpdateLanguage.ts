import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IUpdateLanguageMutation,
  IUpdateLanguageMutationVariables,
} from '../../../gql/types';
import LanguageFragment from '../fragments/LanguageFragment';

const UpdateLanguageMutation = gql`
  mutation UpdateLanguage($language: UpdateLanguageInput!, $languageId: ID!) {
    updateLanguage(language: $language, languageId: $languageId) {
      ...LanguageFragment
    }
  }
  ${LanguageFragment}
`;

const useUpdateLanguage = () => {
  const [updateLanguageMutation] = useMutation<
    IUpdateLanguageMutation,
    IUpdateLanguageMutationVariables
  >(UpdateLanguageMutation);

  const updateLanguage = async ({
    language: { isoCode, isActive },
    languageId,
  }: IUpdateLanguageMutationVariables) => {
    return updateLanguageMutation({
      variables: {
        language: { isoCode, isActive },
        languageId,
      },
      refetchQueries: ['ShopStatus', 'ShopInfo', 'Languages'],
    });
  };

  return {
    updateLanguage,
  };
};

export default useUpdateLanguage;
