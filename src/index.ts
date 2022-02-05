// const express = require("express");
import express, { Request, Response } from "express";
import client from "./redis/index";
// const cookieParser = require("cookie-parser");
import cookieParser from "cookie-parser";
// const app = express();
// const path = require("path");
import path from "path";
// import { server, app } from "./utils/socket";
const { server, app } = require("./utils/socket");
require("./db/connect");
const postImgPath = path.join(__dirname, "../uploads/");
app.use("/uploads", express.static(postImgPath)); // you can access image
const PORT = process.env.PORT || 4000;
console.log("PORT: " + PORT);
const userRoutes = require("./routes/user");
const postRouter = require("./routes/post");
const msgRouter = require("./routes/messages");
app.use(express.json());
app.use(cookieParser());

app.use(userRoutes);
app.use(postRouter);
app.use(msgRouter);

server.listen(PORT);
