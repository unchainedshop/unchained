export const MultiChoiceFilter = {
  _id: "multichoice-filter",
  created: new Date("2020-03-16T09:31:42.690+0000"),
  type: "MULTI_CHOICE",
  key: "tags",
  options: ["highlight", "tag-1", "tag-2"],
  updated: new Date("2020-03-16T09:32:31.996+0000"),
  isActive: false,
};

export const GermanMultiChoiceFilterText = {
  _id: "german",
  filterId: "multichoice-filter",
  filterOptionValue: null,
  locale: "de",
  title: "Special",
  updated: new Date("2020-03-16T09:32:10.940+0000"),
  subtitle: null,
};

export const FrenchMultiChoiceFilterText = {
  _id: "french",
  filterId: "multichoice-filter",
  filterOptionValue: null,
  locale: "fr",
  updated: new Date("2020-03-16T09:32:10.943+0000"),
};

export default async function seedFilters(db) {
  await db.collection("filters").findOrInsertOne(MultiChoiceFilter);
  await db
    .collection("filter_texts")
    .findOrInsertOne(GermanMultiChoiceFilterText);
  await db
    .collection("filter_texts")
    .findOrInsertOne(FrenchMultiChoiceFilterText);
}
