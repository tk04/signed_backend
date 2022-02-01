"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// const express = require("express");
const express_1 = __importDefault(require("express"));
const auth = require("../middleware/auth");
// import auth from "../middleware/auth";
const Message = require("../models/message");
const mongoose = require("mongoose");
const router = express_1.default.Router();
// const User = require("../models/user");
router.get("/api1/messages", auth, async (req, res) => {
    const messages = await Message.find({
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
