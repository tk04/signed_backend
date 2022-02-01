"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// const mongoose = require("mongoose");
const mongoose_1 = __importDefault(require("mongoose"));
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
mongoose_1.default.connect("mongodb+srv://tk:Aloufipro1@cluster0.aoxpu.mongodb.net/signed?retryWrites=true&w=majority");
const userSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    bio: {
        type: String,
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Email is invalid");
            }
        },
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minLength: 7,
        validate(value) {
            if (value.toLowerCase().includes("password")) {
                throw new Error("Password cannot contain 'password'");
            }
        },
    },
    followers: {
        type: [mongoose_1.default.SchemaTypes.ObjectId],
    },
    following: {
        type: [mongoose_1.default.SchemaTypes.ObjectId],
    },
    accomplishments: {
        type: [String],
    },
    keywords: {
        type: [String],
        maxlength: 3,
    },
    socials: [
        {
            twitter: {
                type: String,
            },
            instagram: {
                type: String,
            },
            youtube: {
                type: String,
            },
        },
    ],
    experiences: [
        {
            org_name: {
                type: String,
            },
            position: {
                type: String,
            },
            description: {
                type: String,
            },
        },
    ],
    avatar: {
        type: Buffer,
    },
}, {
    timestamps: true,
});
userSchema.virtual("posts", {
    // not stored on databse, just for mongoose to be able to identify relationships between models
    ref: "Post",
    localField: "_id",
    foreignField: "owner", // name of field in Task model that creates relationship
});
userSchema.statics.Login = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error("Unable to login");
    }
    const passMatch = await bcrypt.compare(password, user.password);
    if (!passMatch) {
        throw new Error("Unable to login");
    }
    return user;
};
userSchema.methods.generateAuthToken = function () {
    const user = this;
    const token = jwt.sign({ id: user._id }, "testing123123_fzxasszxc");
    return token;
};
userSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.createdAt;
    delete userObject.updatedAt;
    return userObject;
};
userSchema.methods.basicInfo = function () {
    const user = this;
    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.createdAt;
    delete userObject.updatedAt;
    delete userObject.experiences;
    delete userObject.accomplishments;
    delete userObject.followers;
    delete userObject.following;
    delete userObject.bio;
    delete userObject.email;
    delete userObject.socials;
    delete userObject.keywords;
    return userObject;
};
userSchema.methods.fullUser = function () {
    const user = this;
    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.createdAt;
    delete userObject.updatedAt;
    return userObject;
};
userSchema.pre("save", async function (next) {
    const user = this;
    if (user.isModified("password")) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    next();
});
const User = mongoose_1.default.model("User", userSchema);
module.exports = User;
