const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    to: {
      type: [String],
      required: true,
    },
    from: {
      type: [String],
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
const Message = mongoose.model("message", messageSchema);
module.exports = Message;
