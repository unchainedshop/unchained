import { log } from "meteor/unchained:core-logger";
import callMethod from "../../../callMethod";

export default function(root, methodArguments, context) {
  log("mutation loginAsGuest");
  try {
    return callMethod(context, "login", {
      ...methodArguments,
      createGuest: true
    });
  } catch (error) {
    throw error;
  }
}
