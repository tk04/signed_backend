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
      console.log(thereUser._id);
      return { user: user.username, userProfile: thereUser._id };
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
      socket.join(`${user.user}-${to}`);
      socket.data.join = `${user.user}-${to}`;
      socket.data.toUser = user.userProfile;
      socket.emit("joined");
      socket.data.room = `${to}-${user.user}`;
      const messages = await Message.findOne().or([
        { to: socket.data.room.split("-") },
        { from: socket.data.room.split("-") },
      ]);
      if (messages === null) {
        const msg = new Message({
          body: [],
          to: Array.from(socket.data.room.split("-")),
          from: Array.from(socket.data.join.split("-")),
          toUser: socket.data.toUser,
        });
        await msg.save();
        socket.data.messages = msg;
      } else {
        socket.data.messages = messages;
      }
      console.log(socket.data.messages);
      socket.emit("loadMessages", messages);
    } else {
      socket.emit("failed");
    }
  });

  socket.on("newMessage", async (data) => {
    // const msg = new Message({
    //   body: data,
    //   to: Array.from(socket.data.room.split("-")),
    //   from: Array.from(socket.data.join.split("-")),
    //   toUser: socket.data.toUser,
    // });
    const msg = socket.data.messages;
    if (msg) {
      console.log(msg.body);
      msg.body.push({ body: data, isUser: true });
      await msg.save();
      console.log(msg.body);
      console.log("SAVED");
    }
    // if (msg.body) {
    //   msg.body.concat(data);
    // } else {
    //   msg.body = [data];
    // }
    socket.data.messages.body.push(data);
    io.to(socket.data.room).emit("message", msg);
    if (socket.data.room.split("-")[0] !== socket.data.room.split("-")[1]) {
      io.to(socket.data.join).emit("message", msg);
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
