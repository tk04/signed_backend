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
const upload = multer({ storage: storage });

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
    let imgArr = [];
    for (const file of req.files) {
      imgArr.push(`${file.filename.split(".")[0]}.png`);
      await sharp(file.path)
        .metadata()
        .then(({ width, height }) =>
          sharp(file.path)
            .rotate()
            .resize(parseInt(width * 0.8), parseInt(height * 0.8), {
              fit: sharp.fit.outside,
            })
            // .withMetadata()
            .toFile(
              path.resolve(
                file.destination,
                "resized",
                file.filename.split(".")[0] + ".png"
              )
            )
        );

      fs.unlinkSync(file.path);
    }
    post.images = imgArr;
    // console.log(req.files);
    // post.images = imgArr;
    // await post.save();
    await post.save();
    res.send({ images: post.images });
  }
);

router.get("/api/posts/:id", auth, async (req, res) => {
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
      throw new Error("user not found");
    }
    res.send(posts);
  } catch (e) {
    res.status(404).send();
  }
});

module.exports = router;
