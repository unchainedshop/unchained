import "./db/factories";
import runMigrations from "./db/schema";
import "./db/helpers";

export * from "./db/collections";
export default () => {
  // configure
  runMigrations();
};
