import { log } from "meteor/unchained:core-logger";
import { AssortmentLinks } from "meteor/unchained:core-assortments";

export default function(root, { assortmentLinkId }, { userId }) {
  log(`mutation removeAssortmentLink ${assortmentLinkId}`, { userId });
  const assortmentLink = AssortmentLinks.findOne({ _id: assortmentLinkId });
  AssortmentLinks.remove({ _id: assortmentLinkId });
  return assortmentLink;
}
