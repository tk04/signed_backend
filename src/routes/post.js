const Post = require("../models/post");
const express = require("express");
const auth = require("../middleware/auth");
const sharp = require("sharp");
const multer = require("multer");
const router = express.Router();
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/");
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype == "image/png" ||
      file.mimetype == "image/jpg" ||
      file.mimetype == "image/jpeg"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error("Only .png, .jpg and .jpeg images allowed!"));
    }
  },
});

router.post("/api1/posts", auth, async (req, res) => {
  const post = new Post({
    ...req.body,
    owner: req.user.username,
  });
  try {
    await post.save();
    res.status(201).send(post);
  } catch (e) {
    res.status(400).send({
      error: e.message,
    });
  }
});
router.post(
  "/api1/posts/:id/images",
  upload.array("images", 4),
  async (req, res) => {
    const post = await Post.findOne({ _id: req.params.id });
    const userFolder = path.join(__dirname, `../../uploads/${post.owner}`);
    if (!fs.existsSync(userFolder)) {
      fs.mkdirSync(userFolder);
    }
    let imgArr = [];
    for (const file of req.files) {
      imgArr.push(
        `${req.protocol}://${req.headers.host}/uploads/${post.owner}/${
          file.filename.split(".")[0]
        }.png`
      );
      try {
        await sharp(file.path)
          .metadata()
          .then(({ width, height }) =>
            sharp(file.path)
              .rotate()
              .resize(parseInt(width * 0.8), parseInt(height * 0.8), {
                fit: sharp.fit.outside,
              })
              .withMetadata()
              .toFile(
                path.resolve(
                  file.destination,
                  post.owner,
                  file.filename.split(".")[0] + ".png"
                )
              )
          );
      } catch (e) {
        fs.unlinkSync(
          `uploads/${post.owner}/${file.filename.split(".")[0]}.png`
        );
        fs.unlinkSync(file.path);
        return res.status(500).send({ err: e.message });
      }
    }
    post.images = imgArr;

    await post.save();
    res.send({ images: post.images });
  }
);

router.get("/api/post/:id", auth, async (req, res) => {
  const post = await Post.findOne({ _id: req.params.id });
  if (!post) {
    return res.status(404).send();
  }
  res.send(post);
});

router.get("/api1/posts/:uid", async (req, res) => {
  try {
    const posts = await Post.find({ owner: req.params.uid });
    if (!posts) {
      throw new Error("post not found");
    }
    res.send(posts);
  } catch (e) {
    res.status(404).send();
  }
});
router.post("/api1/posts/:postId/like", auth, async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.postId });
    if (!post) {
      throw new Error("post not found");
    }
    const likesSet = new Set(post.likes);
    if (likesSet.has(req.user.username)) {
      likesSet.delete(req.user.username);
    } else {
      likesSet.add(req.user.username);
    }
    post.likes = Array.from(likesSet);
    await post.save();
    res.send(post);
  } catch (e) {
    res.status(404).send({ e: e.message });
  }
});
router.post("/api1/posts/:postId/unlike", auth, async (req, res) => {
  try {
    const post = await Post.find({ _id: req.params.postId });
    if (!post) {
      throw new Error("post not found");
    }
    post.likes.splice(req.user.username, 1);
    await post.save();
    res.send(post);
  } catch (e) {
    res.status(404).send();
  }
});

module.exports = router;
