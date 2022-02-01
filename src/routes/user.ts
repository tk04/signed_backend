// const express = require("express");
import express, { Request, Response } from "express";
const User = require("../models/user");
const auth = require("../middleware/auth");
const sharp = require("sharp");
// const multer = require("multer");
import multer from "multer";
import { IRequest } from "../middleware/auth";
const jwt = require("jsonwebtoken");
const router = express.Router();
const cors = require("cors");
const mongoose = require("mongoose");
const upload = multer({
  limits: {
    fileSize: 1000000, // in MB
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|JPG|JPEG|PNG)$/)) {
      return cb(new Error("Please upload a .png, .jpeg, or .jpg image"));
    }
    cb(null, true);
  },
});
router.post("/api1/users/signup", async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    const token = user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(404).send(e);
  }
});

router.post("/api1/users/login", async (req, res) => {
  try {
    const user = await User.Login(req.body.email, req.body.password);
    const token = await user.generateAuthToken();
    res.status(200).send({ user, token });
  } catch (e) {
    res.status(404).send({ error: "Could not login" });
  }
});

router.get("/api1/users/me", auth, async (req: IRequest, res) => {
  const user = req.user.fullUser();
  // if (includeAvatar === "true") {
  //   return res.send({ user, avatar: req.user.avatar });
  // } else {
  res.send({ user });
  // }
});

router.get("/api1/users/:username", async (req, res) => {
  try {
    console.log(req.query);
    const token = req.headers.authorization
      ? req.headers.authorization.replace("Bearer ", "")
      : null;
    const uid = req.params.username;
    const user = await User.findOne({ username: uid });
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }
    if (token) {
      try {
        const decoded = jwt.verify(token, "testing123123_fzxasszxc");
        if (mongoose.Types.ObjectId(decoded.id).equals(user._id)) {
          return res.send({ isUser: true });
        } else {
          for (const f of user.followers) {
            if (mongoose.Types.ObjectId(decoded.id).equals(f)) {
              return res.send({ user, isFollowing: true });
            }
          }
          res.send({ user, isFollowing: false });
        }
      } catch (e: any) {
        res.send({ user, e: e.message });
      }
    } else {
      res.send({ user });
    }
  } catch (e: any) {
    res.send({ error: e.message });
  }
});

router.patch("/api1/users/me", auth, async (req: IRequest, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = [
    "name",
    "username",
    "email",
    "password",
    "bio",
    "accomplishments",
    "keywords",
    "socials",
    "experiences",
  ];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );
  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }
  try {
    updates.forEach((update) => (req.user[update] = req.body[update]));
    await req.user.save();
    const user = req.user.fullUser();
    res.send({ user });
  } catch (e) {
    res.status(400).send(e);
  }
});
interface Ifile extends Request {
  file?: any;
  user?: any;
}
router.post(
  "/api1/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req: Ifile, res: Response) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();
    req.user.avatar = buffer; // multer addes file to req obj if destination not specified in config
    await req.user.save();
    res.send();
  },
  (err: any, req: IRequest, res: any, next: any) => {
    // function to run when err happens
    res.status(400).send({ error: err.message });
  }
);

router.get("/api1/users/me/username", auth, async (req: IRequest, res) => {
  res.send({ username: req.user.username });
});
router.get("/api1/users/:username/avatar", async (req, res) => {
  const uid = req.params.username;
  const user = await User.findOne({ username: uid });
  if (!user) {
    return res.status(404).send({ error: "User not found" });
  }
  res.set("Content-Type", "image/png"); // set response headers
  res.send({ avatar: user.avatar });
});

// router.post("/api1/users/:uid/follow", auth, async (req, res) => {
//   try {
//     const followSet = new Set(req.user.following);
//     const user = await User.findOne({
//       _id: mongoose.Types.ObjectId(req.params.uid),
//     });
//     if (!user) {
//       throw new Error("user not found");
//     }
//     const followUserSet = new Set(user.followers);

//     console.log(followSet.size);
//     for (const id of followSet) {
//       if (id.equals(mongoose.Types.ObjectId(req.params.uid))) {
//         followSet.delete(mongoose.Types.ObjectId(req.params.uid));
//       }
//     }
//     console.log(followSet.size);
//     if (followSet.has(mongoose.Types.ObjectId(req.params.uid))) {
//       followSet.delete(req.params.uid);
//       followUserSet.delete(req.user._id);
//       req.user.following = Array.from(followSet);
//       user.followers = Array.from(followUserSet);
//       await req.user.save();
//       await user.save();
//       return res.send({ msg: "deleted follow" });
//     } else {
//       followSet.add(req.params.uid);
//       followUserSet.add(req.user._id);
//       req.user.following = Array.from(followSet);
//       user.followers = Array.from(followUserSet);
//       await user.save();
//       await req.user.save();
//       res.send({ msg: "added follow" });
//     }
//   } catch (e) {
//     res.status(404).send({ e: e.message });
//   }
// });
router.post("/api1/users/:uid/follow", auth, async (req: IRequest, res) => {
  try {
    const uid = mongoose.Types.ObjectId(req.params.uid);
    const user = await User.findOne({ _id: uid });
    if (!user) {
      throw new Error("no user found");
    }
    for (const f of req.user.following) {
      if (f.equals(uid)) {
        req.user.following.splice(uid, 1);
        user.followers.splice(mongoose.Types.ObjectId(req.user._id), 1);
        await user.save();
        await req.user.save();
        return res.send({ e: "user unFollowed" });
      }
    }
    req.user.following.push(uid);
    user.followers.push(mongoose.Types.ObjectId(req.user._id));
    await user.save();
    await req.user.save();
    res.send({ e: "user followed" });
  } catch (e: any) {
    res.status(404).send({ e: e.message });
  }
});
interface IQuery extends Request {
  query: { skip: string; keyword: string[] };
  user?: any;
}
router.get("/api1/search/users", async (req: IQuery, res) => {
  const skip = parseInt(req.query.skip) || 0;
  const users = await User.find({
    username: {
      $regex: req.query.keyword,
      $options: "i",
    },
  })
    .limit(3)
    .skip(skip);

  res.send(users);
});
router.get("/api1/related/users", auth, async (req: IQuery, res) => {
  const skip = parseInt(req.query.skip) || 0;
  if (req.user.keywords.length > 0) {
    const users = await User.find({
      keywords: {
        $in: req.user.keywords,
      },
      _id: {
        $ne: mongoose.Types.ObjectId(req.user._id),
      },
    })
      .sort({ createdAt: 1 })
      .limit(3)
      .skip(skip)
      .where();

    res.send(users);
  } else {
    const users = await User.find({
      _id: {
        $ne: mongoose.Types.ObjectId(req.user._id),
      },
    })
      .sort({ createdAt: 1 })
      .limit(3)
      .skip(skip)
      .where();

    res.send(users);
  }
});
module.exports = router;
