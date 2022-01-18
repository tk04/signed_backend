const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
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
    },
    images: {
      type: [String],
      maxlength: 4,
    },
  },
  {
    timestamps: true,
  }
);

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
