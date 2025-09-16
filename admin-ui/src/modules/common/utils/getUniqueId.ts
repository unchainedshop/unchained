const generateUniqueId = ({ _id, texts }: any) => {
  return `${texts?.slug?.split('/').join('') || ''}_id_${_id}`;
};

export const parseUniqueId = (value) => {
  if (!value) return null;
  const slugAndId = value?.split('_id_');
  return slugAndId?.pop();
};

export const parseSlug = (value) => {
  if (!value) return null;
  const [slug] = value?.split('_id_') || [];
  return slug;
};

export default generateUniqueId;
