"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const http = require("http");
const express = require("express");
const app = express();
const User = require("../models/user");
const server = http.createServer(app);
const jwt = require("jsonwebtoken");
const Message = require("../models/message");
const io = new socket_io_1.Server(server, {
    cors: {
        origin: ["http://localhost:3000", "https://signed.vercel.app"],
        methods: ["GET", "POST"],
    },
});
const auth = async (token, toUser) => {
    try {
        const decoded = jwt.verify(token, "testing123123_fzxasszxc");
        const user = await User.findOne({ _id: decoded.id });
        const thereUser = await User.findOne({ username: toUser });
        if (user && thereUser) {
            if (user.username === thereUser.username) {
                return false;
            }
            else {
                // console.log(thereUser._id);
                return { user: user.username, user1: thereUser._id, user2: user._id };
            }
        }
        else {
            return false;
        }
    }
    catch (e) {
        return false;
    }
};
let connectCounter;
io.on("connection", (socket) => {
    // console.log(socket.id);
    socket.on("join", async (to) => {
        const user = await auth(socket.handshake.auth.token, to);
        if (user) {
            socket.join(`${user.user}-${to}`);
            socket.data.user = user.user;
            socket.data.join = `${user.user}-${to}`;
            // socket.data.toUser = user.userProfile;
            socket.emit("joined");
            socket.data.room = `${to}-${user.user}`;
            const messages = await Message.findOne()
                .or([
                { to: socket.data.room.split("-") },
                { from: socket.data.room.split("-") },
            ])
                .populate({
                path: "users",
                model: "User",
                match: { _id: { $ne: user.user2 } },
                select: "username name avatar",
            });
            if (messages === null) {
                const msg = new Message({
                    body: [],
                    to: Array.from(socket.data.room.split("-")),
                    from: Array.from(socket.data.join.split("-")),
                    users: [user.user1, user.user2],
                });
                // console.log("User length: ");
                // console.log(user.user2);
                // await msg.save();
                await Message.populate(msg, {
                    path: "users",
                    model: "User",
                    // match: { _id: { $ne: user.user2 } },
                    select: "username name avatar",
                });
                // console.log(realMsg);
                socket.data.messages = msg;
                // console.log(popMsg);
            }
            else {
                socket.data.messages = messages;
            }
            // console.log(socket.data.messages);
            socket.emit("userInfo", socket.data.messages.users[0]);
            socket.emit("loadMessages", socket.data.messages.body);
        }
        else {
            socket.emit("failed");
        }
    });
    socket.on("newMessage", async (data) => {
        const msg = socket.data.messages;
        // console.log("user length top: " + msg);
        // console.log(msg);
        if (msg) {
            // console.log(socket.data);
            msg.body.push({ body: data, isUser: socket.data.user });
            // console.log("user length: " + msg.users.length);
            await msg.save();
            // console.log(msg.body);
            // console.log("SAVED");
        }
        io.to(socket.data.room).emit("message", {
            body: data,
            isUser: socket.data.user,
        });
        if (socket.data.room.split("-")[0] !== socket.data.room.split("-")[1]) {
            io.to(socket.data.join).emit("message", {
                body: data,
                isUser: socket.data.user,
            });
        }
        // await socket.data.messages.save();
    });
    // socket.on("join", () => {
    //   counter++;
    // });
    // socket.on("disconnect", () => {
    //   console.log("disconnected");
    //   counter--;
    // });
});
module.exports = {
    app,
    server,
};
