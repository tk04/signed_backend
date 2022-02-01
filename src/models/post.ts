// const mongoose = require("mongoose");
import mongoose from "mongoose";
const optionsFunction = () => {
  return { select: "username name avatar" };
};
interface PostType extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  text: string;
  likes: string[];
  commentTo: mongoose.Types.ObjectId;
  comments: mongoose.Types.ObjectId;
  images: string[];
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
const postSchema = new mongoose.Schema<PostType>(
  {
    text: {
      type: String,
      required: true,
    },
    likes: {
      type: [String],
    },
    owner: {
      type: mongoose.SchemaTypes.ObjectId,
      required: true,
      ref: "User",
      autopopulate: optionsFunction,
    },
    images: {
      type: [String],
      maxlength: 4,
    },
    comments: {
      type: [mongoose.SchemaTypes.ObjectId],
      ref: "Post",
    },
    commentTo: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Post",
      autopopulate: true,
    },
  },
  {
    timestamps: true,
  }
);
postSchema.plugin(require("mongoose-autopopulate"));

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
