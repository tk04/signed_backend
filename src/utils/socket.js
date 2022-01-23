const { Server } = require("socket.io");
const http = require("http");
const express = require("express");
const app = express();
const User = require("../models/user");
const mongoose = require("mongoose");
const server = http.createServer(app);
const jwt = require("jsonwebtoken");
const Message = require("../models/message");
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const auth = async (token, toUser) => {
  try {
    const decoded = jwt.verify(token, "testing123123_fzxasszxc");
    const user = await User.findOne({ _id: decoded.id });
    const thereUser = await User.findOne({ username: toUser });

    if (user && thereUser) {
      return user.username;
    } else {
      return false;
    }
  } catch (e) {
    return false;
  }
};
io.on("connection", (socket) => {
  console.log(socket.id);
  // console.log(socket.handshake);
  // if (socket.handshake.auth.token && socket.handshake.query.toUser) {
  //   const isAuth = await auth(
  //     socket.handshake.auth.token,
  //     socket.handshake.query.toUser
  //   );
  //   if (isAuth) {
  //     socket.emit("authorized");
  //     socket.data.user = isAuth;
  //     socket.join(socket.handshake.query.toUser);
  //     socket.data.room = socket.handshake.query.toUser;
  //     console.log(socket.handshake.query.toUser);
  //   }
  // }
  socket.join("tk");
  // socket.on("join", async (toUser) => {
  //   const isAuth = await auth(socket.handshake.auth.token, toUser);
  //   if (isAuth) {
  //     io.to(socket.id).emit("authorized");
  //     socket.data.user = isAuth;
  //     socket.join(toUser);
  //     socket.data.room = toUser;
  //   }
  // });
  socket.on("newMessage", (data) => {
    const msg = new Message({ ...data, from: socket.data.user });
    console.log(msg);
    io.to("tk").emit("message", msg);
    // await msg.save();
    // console.log(socket.data.user);
    // console.log(msg);
  });
});

module.exports = {
  app,
  server,
};
