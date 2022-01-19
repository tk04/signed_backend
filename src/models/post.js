const mongoose = require("mongoose");

const optionsFunction = () => {
  return { select: "username name avatar" };
};
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
