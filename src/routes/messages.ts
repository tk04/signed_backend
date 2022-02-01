// const express = require("express");
import express, { Request, Response } from "express";
const auth = require("../middleware/auth");
// import auth from "../middleware/auth";
const Message = require("../models/message");
import { MsgType } from "../models/message";
import { IRequest } from "../middleware/auth";
const mongoose = require("mongoose");
const router = express.Router();
// const User = require("../models/user");

router.get("/api1/messages", auth, async (req: IRequest, res: Response) => {
  const messages: MsgType = await Message.find({
    from: {
      $in: [req.user.username],
    },
  }).populate({
    path: "users",
    model: "User",
    match: { _id: { $ne: req.user._id } },

    select: "username name avatar",
  });

  res.send(messages);
});

module.exports = router;
