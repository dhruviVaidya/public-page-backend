import * as express from "express";
import config from "./config/default";
import connect from "./helper/connect";
import { log } from "./helper/logger";
import * as cors from "cors";
import * as bodyParser from "body-parser";
import * as httpContext from "express-http-context";
const { v4: uuidv4 } = require("uuid");

// Route files
// var route = require("./routes/index");
import * as route from "./routes/index";

//port setup
const PORT = config.PORT;

//app created
const app = express();

//middleware setup
app.use(cors({ origin: "*", optionsSuccessStatus: 200 }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(httpContext.middleware);

app.use(function (req, res, next) {
  const traceContext = req.headers["x-cloud-trace-context"];
  if (typeof traceContext === "string") {
    const traceId = (traceContext as string).split("/")[0];
    httpContext.set("traceId", traceId);
  }
  next();
});

app.use((req, res, next) => {
  httpContext.set("traceId", uuidv4());
  const logs = {
    name: "course",
    method: req.method,
    url: req.url,
    body: req.body,
    query: req.query,
    ip: req.ip,
    property: req.get("User-Agent"),
    heards: req.headers,
  };
  log.info(req.method + "/course" + req.url + ":" + JSON.stringify(logs));
  next();
});
app.options("*", cors());

process.on("uncaughtException", (e) => {
  log.error(e);
  process.exit(1);
});

process.on("unhandledRejection", (e) => {
  log.error(e);
  process.exit(1);
});

app.get("/", (req, res) => {
  res.status(200).send("welcome to Course builder service");
});

//routes
// app.use("/course", route.courseRoute);
// app.use("/category",route.courseCategoryRoute);
// app.use('/categoryContent',route.courseCategoryContentRoute)
// app.use("/subCategory",route.subCategoryRoute);
// app.use("/subCategoryContent",route.subCategoryContentRoute)
app.use("/offer", route.offerRoute);
// app.use("/coupon",route.couponRoute)

//database connection
const dbConnect = async () => {
  await connect();
};

//app running
app.listen(PORT, () => {
  log.info("server started on " + PORT);
  dbConnect();
});
