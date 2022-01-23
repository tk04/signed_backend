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
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"],
  },
});
let counter = 0;
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
let connectCounter;
io.on("connection", (socket) => {
  console.log(socket.id);
  // console.log(socket.handshake.auth.token);
  // if (socket.handshake.auth.token) {
  //   socket.join(socket.handshake.auth.token);
  // } else {
  // socket.join("tk");
  // }

  socket.on("join", (room) => {
    socket.join(room);

    io.to(room).emit("test");
  });

  socket.on("newMessage", (data) => {
    console.log("new msg");
    console.log(counter);
  });
  // io.to("tk").emit("message", "testing");

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
