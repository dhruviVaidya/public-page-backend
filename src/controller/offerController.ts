import { log } from "../helper/logger";
import config from "../config/default";
import { Request, Response, NextFunction } from "express";
import USER from "../interface/userInterface";
import { offerModel } from "../model/index";
import user_data from "../helper/dummy_user";

export const offerList = async (req: Request, res: Response) => {
  try {
    let { user_id, business_id, company_id, type, permissions } = <USER>(
      user_data
    );
    const offerList = await offerModel.find({
      created_by: user_id,
      business_id,
      company_id,
      isDeleted: false,
    });
    if (!offerList)
      return res.status(204).send({ message: "Something Wrong..." });
    return res.status(200).send({ message: "Success...", offerList });
  } catch (err) {
    log.error(err);
    return res.status(500).send(err.message);
  }
};
