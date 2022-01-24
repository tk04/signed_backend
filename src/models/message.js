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
    users: {
      type: [mongoose.SchemaTypes.ObjectId],
      ref: "User",
      required: true,
    },
    body: {
      type: [
        {
          body: String,
          isUser: String,
        },
      ],
      required: true,
    },
  },
  { timestamps: true }
);
const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
