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

  socket.on("join", async (to) => {
    const user = await auth(socket.handshake.auth.token, to);
    if (user) {
      socket.join(`${user}-${to}`);
      socket.data.join = `${user}-${to}`;
      socket.emit("joined");
      socket.data.room = `${to}-${user}`;
      const messages = await Message.find().or([
        { to: socket.data.room.split("-") },
        { from: socket.data.room.split("-") },
      ]);
      socket.emit("loadMessages", messages);
    } else {
      socket.emit("failed");
    }
  });

  socket.on("newMessage", async (data) => {
    const msg = new Message({
      body: data,
      to: Array.from(socket.data.room.split("-")),
      from: Array.from(socket.data.join.split("-")),
    });
    io.to(socket.data.room).emit("message", msg);
    if (socket.data.room.split("-")[0] !== socket.data.room.split("-")[1]) {
      io.to(socket.data.join).emit("message", msg);
    }
    await msg.save();
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
