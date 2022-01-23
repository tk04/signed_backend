const express = require("express");
const auth = require("../middleware/auth");
const Message = require("../models/message");
const router = express.Router();

router.get("/api1/messages", auth, async (req, res) => {
  const messages = await Message.find({});
});
