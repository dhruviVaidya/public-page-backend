var router = require("express").Router();
import { offerController } from "../controller/";

router.get("/offerList", offerController.offerList);

export default router;
