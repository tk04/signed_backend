const jwt = require("jsonwebtoken");
const User = require("../models/user");
import { Request, Response, NextFunction } from "express";
import { UserType } from "../models/user";
export interface IRequest extends Request {
  user?: any; //UserType;
  query: any;
}
const auth = async (req: IRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token;
    // const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, "testing123123_fzxasszxc");
    const user = await User.findOne({ _id: decoded.id });
    if (!user) {
      throw new Error();
    }
    req.user = user;
    next();
  } catch (e) {
    res.status(401).send({ error: "Please authenticate" });
  }
};
// export default auth;
module.exports = auth;
