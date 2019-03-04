import { fakeTimestampFields } from "meteor/unchained:utils";
import { Factory } from "meteor/dburles:factory";
import faker from "faker";
import { Countries } from "./collections";

Factory.define("country", Countries, {
  isoCode: () => null,
  authorId: () => Factory.get("user"),
  isActive: () => faker.random.boolean(),
  isBase: () => false,
  ...fakeTimestampFields
});
