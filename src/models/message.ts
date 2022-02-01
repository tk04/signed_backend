import { ObjectId } from "mongoose";
import mongoose from "mongoose";
// const mongoose = require("mongoose");

export interface MsgType extends mongoose.Document {
  _id: ObjectId;
  to: String[];
  from: String[];
  users: ObjectId[];
  body: { body: string; isUser: string }[];
  createdAt: Date;
  updatedAt: Date;
}
const messageSchema = new mongoose.Schema<MsgType>(
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
