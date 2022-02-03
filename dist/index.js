"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// const express = require("express");
const express_1 = __importDefault(require("express"));
// const cookieParser = require("cookie-parser");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
// const app = express();
// const path = require("path");
const path_1 = __importDefault(require("path"));
// import { server, app } from "./utils/socket";
const { server, app } = require("./utils/socket");
require("./db/connect");
const postImgPath = path_1.default.join(__dirname, "../uploads/");
app.use("/uploads", express_1.default.static(postImgPath)); // you can access image
const PORT = process.env.PORT || 4000;
console.log("PORT: " + PORT);
const userRoutes = require("./routes/user");
const postRouter = require("./routes/post");
const msgRouter = require("./routes/messages");
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use(userRoutes);
app.use(postRouter);
app.use(msgRouter);
const index_1 = __importDefault(require("./redis/index"));
app.get("/redis", async (req, res) => {
    //   await client.set("tk", JSON.stringify({ tk: "aloufi" }));
    const redis = await (0, index_1.default)();
    await redis.set("tk", "test");
    const val = await redis.get("tk");
    console.log(val);
    res.send("REIDSS");
});
server.listen(PORT);
