const express = require("express");
const auth = require("../middleware/auth");
const Message = require("../models/message");
const mongoose = require("mongoose");
const router = express.Router();
const User = require("../models/user");
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
