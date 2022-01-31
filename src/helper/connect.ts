const mongoose = require("mongoose");
import { log } from "./logger";
import config from "../config/default";
const connect = () => {
  return mongoose
    .connect(config.DATABASE, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      log.info("Databse is Up..." + config.DATABASE);
    })
    .catch((err: string) => {
      log.error("Error in Databse Connection..." + err);
      process.exit(1);
    });
};
export default connect;
