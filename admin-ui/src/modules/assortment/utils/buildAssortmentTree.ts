const buildAssortmentTree = (assortments) => {
  let cleanedAssortmentData = assortments?.map((assortment) => ({
    id: assortment?._id,
    slug: assortment?.texts.slug,
    title: assortment?.texts.title,
    subtitle: assortment?.texts.subtitle,
  }));

  cleanedAssortmentData = [
    cleanedAssortmentData,
    assortments
      ?.map((assortment) =>
        assortment?.children?.map((child) => ({
          id: child?._id,
          slug: child?.texts.slug,
          title: child?.texts.title,
          subtitle: child?.texts.subtitle,
          childCount: child?.childrenCount,
          parents: [assortment?._id],
        })),
      )
      ?.flat(),
  ];

  return cleanedAssortmentData.filter(Boolean);
};

export default buildAssortmentTree;
