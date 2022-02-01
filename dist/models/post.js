"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// const mongoose = require("mongoose");
const mongoose_1 = __importDefault(require("mongoose"));
const optionsFunction = () => {
    return { select: "username name avatar" };
};
const postSchema = new mongoose_1.default.Schema({
    text: {
        type: String,
        required: true,
    },
    likes: {
        type: [String],
    },
    owner: {
        type: mongoose_1.default.SchemaTypes.ObjectId,
        required: true,
        ref: "User",
        autopopulate: optionsFunction,
    },
    images: {
        type: [String],
        maxlength: 4,
    },
    comments: {
        type: [mongoose_1.default.SchemaTypes.ObjectId],
        ref: "Post",
    },
    commentTo: {
        type: mongoose_1.default.SchemaTypes.ObjectId,
        ref: "Post",
        autopopulate: true,
    },
}, {
    timestamps: true,
});
postSchema.plugin(require("mongoose-autopopulate"));
const Post = mongoose_1.default.model("Post", postSchema);
module.exports = Post;
