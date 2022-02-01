"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const messageSchema = new mongoose_1.default.Schema({
    to: {
        type: [String],
        required: true,
    },
    from: {
        type: [String],
        required: true,
    },
    users: {
        type: [mongoose_1.default.SchemaTypes.ObjectId],
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
}, { timestamps: true });
const Message = mongoose_1.default.model("Message", messageSchema);
module.exports = Message;
