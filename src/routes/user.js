const express = require("express");
const User = require("../models/user");
const auth = require("../middleware/auth");
const sharp = require("sharp");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const router = new express.Router();
const cors = require("cors");

const upload = multer({
  limits: {
    fileSize: 1000000, // in MB
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|JPG|JPEG|PNG)$/)) {
      return cb(new Error("Please upload a .png, .jpeg, or .jpg image"));
    }
    cb(undefined, true);
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

router.get("/api1/users/me", auth, async (req, res) => {
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
        if (decoded.username === user.username) {
          return res.send({ isUser: true });
        } else {
          if (user.followers.includes(decoded.username)) {
            res.send({ user, isFollowing: true });
          } else {
            res.send({ user, isFollowing: false });
          }
        }
      } catch (e) {
        res.send({ user, e: e.message });
      }
    } else {
      res.send({ user });
    }
  } catch (e) {
    res.send({ error: e.message });
  }
});

router.patch("/api1/users/me", auth, async (req, res) => {
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

router.post(
  "/api1/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();
    req.user.avatar = buffer; // multer addes file to req obj if destination not specified in config
    await req.user.save();
    res.send();
  },
  (err, req, res, next) => {
    // function to run when err happens
    res.status(400).send({ error: err.message });
  }
);

router.get("/api1/users/me/username", auth, async (req, res) => {
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

router.post("/api1/users/:username/follow", auth, async (req, res) => {
  try {
    const followSet = new Set(req.user.following);
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      throw new Error("user not found");
    }
    const followUserSet = new Set(user.followers);

    if (followSet.has(req.params.username)) {
      followSet.delete(req.params.username);
      followUserSet.delete(req.user.username);
      req.user.following = Array.from(followSet);
      user.followers = Array.from(followUserSet);
      await req.user.save();
      await user.save();
      return res.send({ msg: "deleted follow" });
    } else {
      followSet.add(req.params.username);
      followUserSet.add(req.user.username);
      req.user.following = Array.from(followSet);
      user.followers = Array.from(followUserSet);
      await user.save();
      await req.user.save();
      res.send({ msg: "added follow" });
    }
  } catch (e) {
    res.status(404).send({ e: e.message });
  }
});
module.exports = router;
